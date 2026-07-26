const crypto = require('crypto');
const catalyst = require('zcatalyst-sdk-node');
const { recordAudit } = require('./audit-log');

const USER_TABLE = 'AthenaUsers';
const ALLOWED_ROLES = new Set(['Constable', 'Investigator', 'Supervisor', 'Analyst', 'Argos']);
const REGISTERABLE_ROLES = new Set(['Constable', 'Investigator', 'Supervisor', 'Analyst']);
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const DEMO_SESSION_DURATION_SECONDS = 30 * 60;

const safeEqual = (left, right) => {
	const leftBuffer = Buffer.from(String(left));
	const rightBuffer = Buffer.from(String(right));
	return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getTokenSecret = () => {
	const secret = process.env.AUTH_TOKEN_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error('AUTH_TOKEN_SECRET must be configured with at least 32 characters.');
	}
	return secret;
};

const hashPassword = (password, salt) =>
	crypto.scryptSync(password, salt, 64).toString('hex');

const signToken = (user, durationSeconds = SESSION_DURATION_SECONDS) => {
	const now = Math.floor(Date.now() / 1000);
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const payload = Buffer.from(JSON.stringify({
		sub: user.Username,
		role: user.Role,
		demo: user.Role === 'Argos',
		iat: now,
		exp: now + durationSeconds
	})).toString('base64url');
	const signature = crypto
		.createHmac('sha256', getTokenSecret())
		.update(`${header}.${payload}`)
		.digest('base64url');

	return `${header}.${payload}.${signature}`;
};

const verifyToken = (token) => {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid session token.');
	}

	const [header, payload, signature] = parts;
	const expectedSignature = crypto
		.createHmac('sha256', getTokenSecret())
		.update(`${header}.${payload}`)
		.digest('base64url');

	if (!safeEqual(signature, expectedSignature)) {
		throw new Error('Invalid session token.');
	}

	const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
	if (!claims.sub || !ALLOWED_ROLES.has(claims.role) || claims.exp <= Math.floor(Date.now() / 1000)) {
		throw new Error('Session token has expired or is invalid.');
	}

	return claims;
};

const getRequestToken = (req) => {
	const customToken = String(req.headers['x-athena-token'] || '').trim();
	if (customToken) {
		return customToken;
	}

	const authorization = String(req.headers.authorization || '');
	return authorization.startsWith('Bearer ') ? authorization.substring(7).trim() : '';
};

const unwrapUser = (row) => row?.[USER_TABLE] || row;

const findUser = async (app, username) => {
	const result = await app.zcql().executeZCQLQuery(
		`SELECT Username, PasswordHash, PasswordSalt, Role, IsActive FROM ${USER_TABLE} WHERE Username = '${username}'`
	);
	return result.length > 0 ? unwrapUser(result[0]) : null;
};

const registerUser = async (req, res) => {
	try {
		const username = String(req.body.username || '').trim().toLowerCase();
		const password = String(req.body.password || '');
		const registrationCode = String(req.body.registrationCode || '');
		const role = String(req.body.role || '');
		const expectedCode = process.env.ATHENA_REGISTRATION_CODE || '3024';

		if (!USERNAME_PATTERN.test(username)) {
			return res.status(400).json({ success: false, error: 'Username must be 3-50 characters and use only letters, numbers, dots, underscores, or hyphens.' });
		}
		if (password.length < 8 || password.length > 128) {
			return res.status(400).json({ success: false, error: 'Password must contain between 8 and 128 characters.' });
		}
		if (!/^\d{4}$/.test(registrationCode) || !safeEqual(registrationCode, expectedCode)) {
			return res.status(403).json({ success: false, error: 'Invalid registration code.' });
		}
		if (!REGISTERABLE_ROLES.has(role)) {
			return res.status(400).json({ success: false, error: 'Select a valid role.' });
		}

		const app = catalyst.initialize(req);
		if (await findUser(app, username)) {
			return res.status(409).json({ success: false, error: 'That username is already registered.' });
		}

		const salt = crypto.randomBytes(16).toString('hex');
		await app.datastore().table(USER_TABLE).insertRow({
			Username: username,
			PasswordHash: hashPassword(password, salt),
			PasswordSalt: salt,
			Role: role,
			IsActive: true,
			CreatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
		});
		await recordAudit({
			app,
			actor: { username, role },
			action: 'USER_REGISTERED',
			targetType: 'UserAccount',
			targetId: username
		});

		return res.status(201).json({ success: true, message: 'Registration successful. Please log in.' });
	} catch (error) {
		console.error('Registration Error:', error);
		return res.status(500).json({ success: false, error: 'Registration could not be completed.' });
	}
};

const loginUser = async (req, res) => {
	try {
		const username = String(req.body.username || '').trim().toLowerCase();
		const password = String(req.body.password || '');

		if (!USERNAME_PATTERN.test(username) || !password) {
			return res.status(400).json({ success: false, error: 'Enter a valid username and password.' });
		}

		const app = catalyst.initialize(req);
		const user = await findUser(app, username);
		if (!user || user.IsActive === false) {
			return res.status(401).json({ success: false, error: 'Invalid username or password.' });
		}

		const suppliedHash = hashPassword(password, user.PasswordSalt);
		if (!safeEqual(suppliedHash, user.PasswordHash)) {
			return res.status(401).json({ success: false, error: 'Invalid username or password.' });
		}
		await recordAudit({
			app,
			actor: { username: user.Username, role: user.Role },
			action: 'USER_LOGIN',
			targetType: 'UserAccount',
			targetId: user.Username
		});

		return res.status(200).json({
			success: true,
			token: signToken(user),
			user: { username: user.Username, role: user.Role }
		});
	} catch (error) {
		console.error('Login Error:', error);
		return res.status(500).json({ success: false, error: 'Login could not be completed.' });
	}
};

const createDemoSession = (req, res) => {
	try {
		const user = { Username: 'demo.argos', Role: 'Argos' };
		return res.status(200).json({
			success: true,
			token: signToken(user, DEMO_SESSION_DURATION_SECONDS),
			user: { username: user.Username, role: user.Role },
			expiresInSeconds: DEMO_SESSION_DURATION_SECONDS,
			access: 'FULL_DEMO'
		});
	} catch (error) {
		console.error('Demo Session Error:', error);
		return res.status(500).json({ success: false, error: 'The public demo is temporarily unavailable.' });
	}
};

const requireAuth = (req, res, next) => {
	try {
		const token = getRequestToken(req);
		if (!token) {
			return res.status(401).json({ success: false, error: 'Authentication required.' });
		}

		req.auth = verifyToken(token);
		return next();
	} catch (error) {
		return res.status(401).json({ success: false, error: 'Your session is invalid or has expired.' });
	}
};

module.exports = {
	createDemoSession,
	getRequestToken,
	loginUser,
	registerUser,
	requireAuth,
	signToken,
	verifyToken
};
