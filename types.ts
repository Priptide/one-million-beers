type User = {
    id: string;
    username: string | null;
    initialCount: number | null;
    currentCount: number;
}

type RecentImage = {
    path: string;
    id?: string;
    username: string;
}