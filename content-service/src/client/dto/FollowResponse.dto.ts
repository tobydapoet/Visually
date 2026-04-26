export class FollowResponse {
  content!: {
    id: number;
    username: string;
    avatar?: string;
  }[];
  totalPages!: number;
  totalElements!: number;
  size!: number;
  number!: number;
}
