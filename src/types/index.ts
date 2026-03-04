export interface TweetData {
	text: string;
	authorName: string;
	authorHandle: string;
	authorAvatarUrl: string;
	timestamp: string;
	imageUrls: string[];
	hasVideo: boolean;
	videoThumbnailUrl: string | null;
}
