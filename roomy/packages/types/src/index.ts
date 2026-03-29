// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserMode = 'FIND_ROOM' | 'FIND_ROOMMATE';
export type SwipeAction = 'LIKE' | 'REJECT' | 'SUPER';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';
export type GroupRole = 'ADMIN' | 'MEMBER';
export type AttendeeStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  profession?: string;
  bio?: string;
  instagramId?: string;
  avatarUrl?: string;
  mode: UserMode;
  smoking: boolean;
  drinking: boolean;
  pets: boolean;
  budgetMin?: number;
  budgetMax?: number;
  createdAt: string;
  quizCompleted?: boolean;
  tags?: string[];
}

export interface PublicUser extends Omit<User, 'email'> {
  compatibilityScore?: number;
  dimScores?: CompatibilityDimScores;
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

export type QuizAnswers = Record<string, number | string | string[]>;

export interface QuizAnswersDTO {
  answers: QuizAnswers;
}

export interface QuizResultDTO {
  answers: QuizAnswers;
  tags: string[];
  selfInsight: string;
}

// ─── Compatibility ────────────────────────────────────────────────────────────

export type DimensionKey =
  | 'clean' | 'sleep' | 'finance' | 'social'
  | 'conflict' | 'privacy' | 'culture' | 'lifestyle'
  | 'personality' | 'gender';

export type CompatibilityDimScores = Record<DimensionKey, number>;

export type FlagType = 'hard' | 'red' | 'yellow';

export interface CompatibilityFlag {
  type: FlagType;
  dim: DimensionKey;
  label: string;
  detail: string;
  score?: number;
}

export interface CompatibilityResult {
  overall: number;
  dimScores: CompatibilityDimScores;
  flags: CompatibilityFlag[];
  hardBlock: boolean;
}

// ─── Swipe & Match ────────────────────────────────────────────────────────────

export interface SwipeRequest {
  toId: string;
  action: SwipeAction;
}

export interface SwipeResponse {
  matched: boolean;
  matchId?: string;
  chatId?: string;
}

export interface Match {
  id: string;
  userId: string;
  matchedId: string;
  score: number;
  matched: PublicUser;
  chatId?: string;
  createdAt: string;
}

// ─── Listing ──────────────────────────────────────────────────────────────────

export interface RoomDetails {
  furnished: boolean;
  ac: boolean;
  attachedBath: boolean;
  balcony: boolean;
  parking: boolean;
  wifi: boolean;
  bhk: string; // '1BHK' | '2BHK' | '3BHK' | 'Studio'
  floorNumber?: number;
}

export interface CurrentTenant {
  name: string;
  profession: string;
  avatarUrl?: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  title: string;
  description: string;
  rent: number;
  deposit?: number;
  location: string;
  area: string;
  city: string;
  photos: string[];
  roomDetails: RoomDetails;
  currentTenants: CurrentTenant[];
  availableFrom: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateListingDTO {
  title: string;
  description: string;
  rent: number;
  deposit?: number;
  location: string;
  area: string;
  city: string;
  roomDetails: RoomDetails;
  currentTenants: CurrentTenant[];
  availableFrom: string;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  listingId: string;
  applicantId: string;
  applicant?: PublicUser;
  status: ApplicationStatus;
  message?: string;
  createdAt: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface Chat {
  id: string;
  matchId: string;
  otherUser: PublicUser;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readAt?: string;
  createdAt: string;
}

export interface SendMessageDTO {
  content: string;
  type?: MessageType;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  'chat:message': (message: Message) => void;
  'chat:typing': (data: { userId: string; chatId: string; isTyping: boolean }) => void;
  'user:online': (data: { userId: string; online: boolean }) => void;
  'match:new': (match: Match) => void;
  'expense:updated': (data: { groupId: string }) => void;
  'call:offer': (data: CallSignal) => void;
  'call:answer': (data: CallSignal) => void;
  'call:ice': (data: { chatId: string; candidate: RTCIceCandidateInit }) => void;
  'call:end': (data: { chatId: string }) => void;
}

export interface ClientToServerEvents {
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
  'chat:message': (data: { chatId: string; content: string; type?: MessageType }) => void;
  'chat:typing': (data: { chatId: string; isTyping: boolean }) => void;
  'call:offer': (data: CallSignal) => void;
  'call:answer': (data: CallSignal) => void;
  'call:ice': (data: { chatId: string; candidate: RTCIceCandidateInit }) => void;
  'call:end': (data: { chatId: string }) => void;
}

export interface CallSignal {
  chatId: string;
  sdp: RTCSessionDescriptionInit;
}

// ─── Group ────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  user: PublicUser;
  role: GroupRole;
  joinedAt: string;
}

// ─── Expense ──────────────────────────────────────────────────────────────────

export interface OcrItem {
  name: string;
  price: number;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  settled: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  totalAmount: number;
  paidById: string;
  paidBy?: PublicUser;
  billImageUrl?: string;
  ocrData?: OcrItem[];
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface CreateExpenseDTO {
  title: string;
  totalAmount: number;
  paidById: string;
  splits: { userId: string; amount: number }[];
}

export interface GroupBalance {
  userId: string;
  user: PublicUser;
  balance: number; // positive = owed to you, negative = you owe
}

// ─── Event ────────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  groupId?: string;
  creatorId: string;
  creator?: PublicUser;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  isPublic: boolean;
  attendees: EventAttendee[];
  myStatus?: AttendeeStatus;
  createdAt: string;
}

export interface EventAttendee {
  userId: string;
  user: PublicUser;
  status: AttendeeStatus;
}

export interface CreateEventDTO {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  isPublic?: boolean;
  groupId?: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SignupDTO {
  email: string;
  password: string;
  name: string;
  age: number;
  profession?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
