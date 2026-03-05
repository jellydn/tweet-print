import { z } from "zod";

export const LinkCardSchema = z.object({
	title: z.string(),
	description: z.string(),
	imageUrl: z.string(),
	url: z.string(),
	domain: z.string(),
});

export const TweetDataSchema: z.ZodType<{
	text: string;
	authorName: string;
	authorHandle: string;
	authorAvatarUrl: string;
	timestamp: string;
	imageUrls: string[];
	hasVideo: boolean;
	videoThumbnailUrl: string | null;
	linkCard: {
		title: string;
		description: string;
		imageUrl: string;
		url: string;
		domain: string;
	} | null;
	isReply: boolean;
	parentTweet: unknown;
	quotedTweet: unknown;
}> = z.lazy(() =>
	z.object({
		text: z.string(),
		authorName: z.string(),
		authorHandle: z.string(),
		authorAvatarUrl: z.string(),
		timestamp: z.string(),
		imageUrls: z.array(z.string()),
		hasVideo: z.boolean(),
		videoThumbnailUrl: z.string().nullable(),
		linkCard: LinkCardSchema.nullable(),
		isReply: z.boolean(),
		parentTweet: TweetDataSchema.nullable(),
		quotedTweet: TweetDataSchema.nullable(),
	}),
);

export const TweetApiResponseSchema = z.object({
	tweets: z.array(TweetDataSchema),
});

export function validateTweetApiResponse(data: unknown) {
	return TweetApiResponseSchema.safeParse(data);
}

export const TwitterPhotoSchema = z.object({
	url: z.string(),
});

export const TwitterUserSchema = z.object({
	screen_name: z.string(),
	name: z.string(),
	profile_image_url_https: z.string().optional(),
});

export const TwitterVideoSchema = z.object({
	duration: z.number().optional(),
	variants: z.array(z.any()).optional(),
	poster: z.string().optional(),
});

export const TwitterCardSchema = z.object({
	binding_values: z.record(
		z.string(),
		z.object({
			string_value: z.string().optional(),
			image_value: z
				.object({
					url: z.string(),
				})
				.optional(),
		}),
	),
});

export const TwitterMediaSchema = z.array(
	z.object({
		media_url_https: z.string(),
	}),
);

export const TwitterEntitiesSchema = z.object({
	media: TwitterMediaSchema.optional(),
});

export const TwitterTweetDataSchema = z.object({
	id_str: z.string().optional(),
	text: z.string().optional(),
	text_html: z.string().optional(),
	created_at: z.string().optional(),
	user: TwitterUserSchema.optional(),
	photos: z.array(TwitterPhotoSchema).optional(),
	video: TwitterVideoSchema.optional(),
	card: TwitterCardSchema.optional(),
	entities: TwitterEntitiesSchema.optional(),
	in_reply_to_status_id_str: z.string().nullable().optional(),
	parent: z.any().optional(),
	quoted_tweet: z.any().optional(),
});

export type TwitterTweetData = z.infer<typeof TwitterTweetDataSchema>;

export function validateTwitterTweetData(data: unknown) {
	return TwitterTweetDataSchema.safeParse(data);
}

export function validateTwitterUser(data: unknown) {
	return TwitterUserSchema.safeParse(data);
}

export function validateTwitterPhoto(data: unknown) {
	return TwitterPhotoSchema.safeParse(data);
}

export function validateTwitterVideo(data: unknown) {
	return TwitterVideoSchema.safeParse(data);
}

export function validateTwitterCard(data: unknown) {
	return TwitterCardSchema.safeParse(data);
}

export function validateTwitterMedia(data: unknown) {
	return TwitterMediaSchema.safeParse(data);
}
