import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    /*
    1.check for videoId
    2.find the video by findOne from Video model
    3.check for = video || video.owner and the req.user id not same && not published => error
    4.likedCriteria object in which video and LikedBy field and gave them values of teh videoId and req.user
    5.alreadyLiked constant findOne videoId
    6.if condition not liked than liked by creating newLikedObject and create methode for like criteria,check
    7.alreadyLiked than disLiked constant made and deleteOne methode and gave likedCriteria
    8.check for diislike and send response by return
    9.wrap whole in tryCatch
    */

    try {
        if (!videoId) {
            throw new ApiError(400, "videoId is required")
        }
        const video = await Video.findOne(videoId)
        if (!video || (video.owner.toString !== req.user?._id && !video.isPublished)) {
            throw new ApiError(400, "Video is not found")
        }
        const likedCriteria = { video: videoId, likedBy: req.user?._id }
        const alreadyLiked = await Video.findById(videoId)
        if (!alreadyLiked) {  //create new like
            const newLiked = await Like.create(likedCriteria)
            if (!newLiked) {
                throw new ApiError(400, "Internal server error unable to liked the video")
            }
            return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    newLiked,
                    "Successfully toggled the video liked"
                ))
        };
        //already liked
        const disLiked = await Like.deleteOne(likedCriteria)
        if (!disLiked) {
            throw new ApiError(400, "Unable to dislike the video")
        }
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "Successfully toggled the video liked"
            ))
    } catch (error) {
        throw new ApiError(400, "Unable to togglled the video like")
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    /*
    1.check for the commentId
    2.find comment by findById methode and agve it commentId
    3.define likedCriteria and gave values to field comment and liked by
    4.alreadyLiked and findById argument likedCriteria
    5.if satement not liked argument alreadyLIked than create newLIke,check and gave res
    6.make dislike constant and use deleteOne methode gave argument as liked Criteria,gave error and gave respone 
    7.wrap in tryCatch
    */
    if (!commentId) {
        throw new ApiError(400, "commentId is required")
    }

    try {
        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(400, "comment is not found")
        }
        const likedCriteria = { comment: commentId, likedBy: req.user?._id };
        const alreadyLiked = await Comment.findOne(likedCriteria)
        if (!alreadyLiked) {
            const newLike = await Like.create(likedCriteria)
            if (!newLike) {
                throw new ApiError(400, "Unabke to like the comment")
            }
            return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    newLike,
                    "Commemt is liked successfully"
                ))
        }
        const disLike = await Like.deleteOne(likedCriteria)
        if (!disLike) {
            throw new ApiError(400, "Unable to dislike")
        }
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "comment like toggled successfully"
            ))
    } catch (error) {
        throw new ApiError(400, "Unable to toggle the like")
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400, "tweetId  is required")
    }

    try {
        const tweet = await Tweet.findOne(tweetId)
        if (!tweet) {
            throw new ApiError(400, "Tweet is not found")
        }
        const likedCriteria = { tweet: tweetId, likedBy: req.user?._id }
        const alreadyLike = await Tweet.findOne(tweetId)
        if (!alreadyLike) {
            const newLike = await Like.create(likedCriteria)
            if (!newLike) {
                throw new ApiError(400, "Unable to like the tweet")
            }
            return res
                .status(200)
                .josn(new ApiResponse(
                    200,
                    newLike,
                    "Like the video successfully"
                ))
        }

        const disLike = await Like.deleteOne(tweetId)
        if (!disLike) {
            throw new ApiError(400, "Unable to dislike the tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "tweet like is toggled succsssdully"
            ))


    } catch (error) {
        throw new ApiError(400, "Unable to toggle the comment like")
    }

});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id
    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId.createFromHexString(userId)
                }
            },
            {
                $lookup: {
                    from: "vidoes",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideos"
                }
            },
            {
                $unwind: "$likedVideos"
            },
            {
                $match: {
                    "likedVideos.isPublished": true
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { owner_id: "$likedVideos.owner" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$owner_id"] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                username: 1,
                                avatar: 1,
                                fullName: 1
                            }
                        }
                    ],
                    as: owner
                },
            },
            {
                $unwind: { path: "$owner", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: "$likedVideos._id",
                    title: "$likedVideos.title",
                    thumbnail: "$likedVideos.thumbnail",
                    owner: {
                        username: "$owner.username",
                        avatar: "$owner.avatar",
                        fullName: "$owner.fullName"
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    likedVideos: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    likedVideos: 1
                }
            }
        ])
        if(likedVideos.length() === 0) {
            return res
            .status(404)
            .json(new ApiResponse(
                404,
                [],
                "Unable to find liked videos"
            ))
        }

        return res
        .status(200)
        .json(new ApiResponse(
            404,
            likedVideos,
            "liked videos fetched successfully"
        ))
    } catch (error) {
        throw new ApiError(400, "Error while fetching the liked videos")
    }
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}



/*


Certainly! Let's break down the working of the aggregation pipeline in the provided code snippet:

1. **User ID Extraction**:
   - The `userId` is extracted from the authenticated user (likely from a JWT token or session).
   - This ID will be used to filter liked videos associated with this specific user.

2. **Aggregation Pipeline**:
   - The aggregation pipeline consists of several stages, each transforming the data step by step.

3. **`$match` Stage**:
   - Filters the `Like` collection to find documents where the `likedBy` field matches the `userId`.
   - This ensures that only liked videos associated with the given user are considered.

4. **`$lookup` Stage (First)**:
   - Joins the `Like` collection with the `videos` collection.
   - Matches the `localField` (from the `Like` collection) with the `foreignField` (from the `videos` collection) based on the `_id`.
   - Creates an array of joined documents with the alias `"likedVideos"`.

5. **`$unwind` Stage**:
   - Deconstructs the `likedVideos` array created by the `$lookup` stage.
   - Each element in the array becomes a separate document in the pipeline.

6. **`$match` Stage (Second)**:
   - Filters the documents to include only those where the `isPublished` field within each `likedVideo` is `true`.
   - Ensures that only published videos are considered.

7. **Nested `$lookup` Stage**:
   - Performs another join with the `users` collection.
   - Uses a sub-pipeline to match the `owner` field from the `likedVideos` array with the `_id` field in the `users` collection.
   - Projects only the necessary fields (`username`, `avatar`, and `fullName`) for the owner.

8. **`$unwind` Stage (Second)**:
   - Deconstructs the `owner` array field (preserving null and empty arrays).
   - This step ensures that even if there is no owner (e.g., unpublished videos), the document continues in the pipeline.

9. **`$project` Stage**:
   - Reshapes the document to include specific fields:
       - `_id`: The video's `_id`.
       - `title`: The video's title.
       - `thumbnail`: The video's thumbnail.
       - `owner`: An object containing owner details (username, avatar, and fullName).

10. **`$group` Stage**:
    - Groups all documents into a single document (since `_id` is set to `null`).
    - Creates an array of liked videos with the alias `"likedVideos"`.

11. **Final `$project` Stage**:
    - Excludes the `_id` field.
    - Retains only the `likedVideos` array for the final output.

12. **Response Handling**:
    - If no liked videos are found, a 404 response is returned.
    - Otherwise, a 200 response with the liked videos array is sent.

In summary, this aggregation pipeline fetches liked videos associated with a specific user, includes video details (such as title and thumbnail), and enriches the data with owner information. The resulting output is an array of liked videos, each with its owner details. 😊  

*/