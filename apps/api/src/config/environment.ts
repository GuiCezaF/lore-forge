import path from 'node:path';
import { config as loadDotEnvFile } from 'dotenv';
import { z } from 'zod';

const DEFAULT_NODE_ENV = 'development';
const DEFAULT_PORT = 3000;
const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:3001';
const DEFAULT_JWT_SECRET = 'loreforge-dev-secret';
const DEFAULT_S3_REGION = 'us-east-1';

function isValidUrlList(value: string): boolean {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .every((entry) => URL.canParse(entry));
}

const GOOGLE_OAUTH_CALLBACK_PATH = '/auth/google/callback';

function isGoogleOAuthCallbackUrl(value: string): boolean {
  try {
    const { pathname } = new URL(value);
    return pathname.replace(/\/+$/, '') === GOOGLE_OAUTH_CALLBACK_PATH;
  } catch {
    return false;
  }
}

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default(DEFAULT_NODE_ENV),
    PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
    GOOGLE_CLIENT_ID: z.string().trim().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().trim().min(1).optional(),
    GOOGLE_OAUTH_REDIRECT_URI: z
      .string()
      .url()
      .refine(isGoogleOAuthCallbackUrl, {
        message:
          'GOOGLE_OAUTH_REDIRECT_URI must end with /auth/google/callback (not /auth/google)',
      })
      .optional(),
    JWT_SECRET: z.string().min(1).default(DEFAULT_JWT_SECRET),
    API_BASE_URL: z.string().url().default(DEFAULT_API_BASE_URL),
    FRONTEND_BASE_URL: z
      .string()
      .trim()
      .min(1)
      .default(DEFAULT_FRONTEND_BASE_URL)
      .refine(isValidUrlList, {
        message:
          'FRONTEND_BASE_URL must contain one or more comma-separated absolute URLs',
      }),
    POST_LOGIN_REDIRECT_URL: z.string().url().optional(),
    COOKIE_DOMAIN: z.string().trim().min(1).optional(),
    DATABASE_URL: z.string().trim().min(1),
    REDIS_URL: z.string().trim().min(1),
    S3_ENDPOINT: z.string().url(),
    S3_BUCKET: z.string().trim().min(1),
    S3_ACCESS_KEY: z.string().trim().min(1),
    S3_SECRET_KEY: z.string().trim().min(1),
    S3_REGION: z.string().trim().min(1).default(DEFAULT_S3_REGION),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.JWT_SECRET === DEFAULT_JWT_SECRET || env.JWT_SECRET.length < 32) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message:
          'JWT_SECRET must be set to a non-default value with at least 32 characters in production',
      });
    }

    if (!env.GOOGLE_CLIENT_ID) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_ID'],
        message: 'GOOGLE_CLIENT_ID is required in production',
      });
    }

    if (!env.GOOGLE_CLIENT_SECRET) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_SECRET'],
        message: 'GOOGLE_CLIENT_SECRET is required in production',
      });
    }
  });

type RawEnvironment = z.infer<typeof environmentSchema>;

export type Environment = Omit<RawEnvironment, 'POST_LOGIN_REDIRECT_URL'> & {
  POST_LOGIN_REDIRECT_URL: string;
};

let cachedEnvironment: Environment | null = null;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `${key}: ${issue.message}`;
    })
    .join('\n');
}

function assignEnvironmentToProcess(env: Environment): void {
  process.env.NODE_ENV = env.NODE_ENV;
  process.env.PORT = String(env.PORT);
  process.env.JWT_SECRET = env.JWT_SECRET;
  process.env.API_BASE_URL = env.API_BASE_URL;
  process.env.FRONTEND_BASE_URL = env.FRONTEND_BASE_URL;
  process.env.POST_LOGIN_REDIRECT_URL =
    env.POST_LOGIN_REDIRECT_URL ?? env.FRONTEND_BASE_URL;
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.REDIS_URL = env.REDIS_URL;
  process.env.S3_ENDPOINT = env.S3_ENDPOINT;
  process.env.S3_BUCKET = env.S3_BUCKET;
  process.env.S3_ACCESS_KEY = env.S3_ACCESS_KEY;
  process.env.S3_SECRET_KEY = env.S3_SECRET_KEY;
  process.env.S3_REGION = env.S3_REGION;

  if (env.GOOGLE_CLIENT_ID) {
    process.env.GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
  }
  if (env.GOOGLE_CLIENT_SECRET) {
    process.env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
  }
  if (env.GOOGLE_OAUTH_REDIRECT_URI) {
    process.env.GOOGLE_OAUTH_REDIRECT_URI = env.GOOGLE_OAUTH_REDIRECT_URI;
  }
  if (env.COOKIE_DOMAIN) {
    process.env.COOKIE_DOMAIN = env.COOKIE_DOMAIN;
  }
}

export function validateEnvironment(
  rawEnvironment: Record<string, unknown>,
): Environment {
  const parsedEnvironment = environmentSchema.safeParse(rawEnvironment);
  if (!parsedEnvironment.success) {
    throw new Error(
      `Invalid environment variables:\n${formatIssues(parsedEnvironment.error)}`,
    );
  }

  return {
    ...parsedEnvironment.data,
    POST_LOGIN_REDIRECT_URL:
      parsedEnvironment.data.POST_LOGIN_REDIRECT_URL ??
      parsedEnvironment.data.FRONTEND_BASE_URL,
  };
}

export function loadEnvironment(options?: {
  cwd?: string;
  envFilePath?: string;
  reload?: boolean;
}): Environment {
  if (cachedEnvironment && !options?.reload) {
    return cachedEnvironment;
  }

  const cwd = options?.cwd ?? process.cwd();
  const envFilePath = options?.envFilePath ?? path.resolve(cwd, '.env');

  loadDotEnvFile({
    path: envFilePath,
    override: false,
    quiet: true,
  });

  const environment = validateEnvironment(process.env);
  assignEnvironmentToProcess(environment);
  cachedEnvironment = environment;
  return environment;
}

export function getEnvironment(): Environment {
  return cachedEnvironment ?? loadEnvironment();
}
