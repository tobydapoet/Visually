export class MemberSummaryResponse {
  id!: number;
  userId!: string;
  username!: string;
  avatarUrl?: string;
  lastSeen!: Date | null;
  isMutedAt!: Date | null;
  mutedUntil!: Date | null;
}
