export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;

  constructor(code: string, message: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.requestId = requestId;
  }
}

export type ProjectType = "SINGLE_EFFECT" | "MIX";

export type ProjectStatus =
  | "DRAFT"
  | "UPLOADING"
  | "READY_TO_RENDER"
  | "QUEUED"
  | "ANALYZING"
  | "RENDERING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export type SingleEffect =
  | "normalise"
  | "speed_pitch"
  | "slow_reverb"
  | "echo"
  | "eq"
  | "bass_boost";

export type TransitionStyle = "safe" | "smooth" | "energetic";
export type OutputFormat = "mp3" | "aac";

export type AudioFileStatus =
  | "PENDING"
  | "UPLOADED"
  | "VALIDATED"
  | "REJECTED"
  | "EXPIRED"
  | "DELETED";

export type AudioFile = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  position: number;
  status: AudioFileStatus;
  expiresAt: string;
  createdAt: string;
};

export type Project = {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  transitionStyle: TransitionStyle;
  outputFormat: OutputFormat;
  singleEffect: SingleEffect | null;
  createdAt: string;
  updatedAt: string;
  files: AudioFile[];
};

export type User = {
  id: string;
  username: string | null;
};

export type ConsentState =
  | {
      policyVersion: string;
      accepted: false;
      consent: null;
    }
  | {
      policyVersion: string;
      accepted: true;
      consent: {
        id: string;
        policyVersion: string;
        privacyAcceptedAt: string | null;
        termsAcceptedAt: string | null;
        rightsConfirmedAt: string | null;
        createdAt: string;
      };
    };

export type Capabilities = {
  stage: number;
  limits: {
    maxTracksPerProject: number;
    maxFileSizeBytes: number;
    maxProjectSizeBytes: number;
    maxOutputDurationSeconds: number;
    originalRetentionHours: number;
    allowedInputExtensions: string[];
  };
  effects: SingleEffect[];
  transitionStyles: TransitionStyle[];
  outputFormats: OutputFormat[];
  policyVersion: string;
  features: {
    render: boolean;
    payments: boolean;
  };
};

export type AuthResponse = {
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
  expiresAt: string;
  user: User;
};

export type MeResponse = User & {
  consent: ConsentState;
  policyVersion: string;
};

export type ProjectsListResponse = {
  items: Project[];
  nextCursor: string | null;
};

export type UploadProjectFileResponse = {
  file: AudioFile;
  project: Project;
};

export type CreateProjectBody = {
  title: string;
  type: ProjectType;
  transitionStyle?: TransitionStyle;
  outputFormat?: OutputFormat;
  singleEffect?: SingleEffect;
};

export type PatchProjectBody = {
  title?: string;
  transitionStyle?: TransitionStyle;
  outputFormat?: OutputFormat;
  singleEffect?: SingleEffect;
};
