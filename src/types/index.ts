export interface LinkCard {
	title: string;
	description: string;
	imageUrl: string;
	url: string;
	domain: string;
}

export interface TweetData {
	text: string;
	authorName: string;
	authorHandle: string;
	authorAvatarUrl: string;
	timestamp: string;
	imageUrls: string[];
	hasVideo: boolean;
	videoThumbnailUrl: string | null;
	linkCard: LinkCard | null;
	isReply: boolean;
	parentTweet: TweetData | null;
}
