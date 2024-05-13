import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { tweetContent } = req.body

    if (!tweetContent || tweetContent.length() === 0) {
        throw new ApiError(400, "tweetContent is required!!!")
    }

    try {
        const tweet = await Tweet.create({
            content: tweetContent,
            owner: req.user?._id
        })

        if (!tweet) {
            throw new ApiError(400, "error while creating the tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                tweet,
                "tweet is created successfully"
            ))
    } catch (error) {
        throw new ApiError(404, "error while creating the tweet")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(404, "userId is required")
    }
    try {
        const tweet = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId.createFromHexString(userId)
                }
            },
            {
                $group: {
                    _id: "$owner",
                    tweet: { $push: "$content" }
                }
            },
            {
                $project: {
                    _id: 0,
                    tweet: 1
                }
            }
        ])
        if (!tweet) {
            throw new ApiError(400, "Error while fetching the user tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                tweet,
                "All the tweets of the user fetched successfully"
            ))
    } catch (error) {
        throw new ApiError(400, error?.message || "Error while getting the user tweet")
    }

});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    /*
    1.get tweetId by req.params,tweetContent from req.body
    2.check for it,apply tryCatch
    3.made existedTweet constant check for the userId in it 
    4.check for the existedTweet
    5.uodatedTweet,use $match and $set and new: true
    6.check for the updatedTweet
    
    */
    const { tweetId } = req.params
    const { tweetContent } = req.baody
    if (!tweetId) {
        throw new ApiError(404, "tweetId is required")
    }
    if (!tweetContent || tweetContent.length() === 0) {
        throw new ApiError(404, "tweet content is requires")
    }
    try {
        const existedTweet = await Tweet.findById(tweetId)
        if (!existedTweet) {
            throw new ApiError(400, "Tweet doesn't exist")
        }

        // user is owner or not
        if (existedTweet.owner.toString() !== req.user?._id) {
            throw new ApiError(404,"Unauthorized Access")
        }
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content: "$tweetContent"
                }
            },{new: true}
        )

        return  res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedTweet,
            "Tweet is updated successfully"
        ))
    } catch (error) {
        throw new ApiError(400, "Error while updating the tweet")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    const { tweetContent } = req.baody
    if (!tweetId) {
        throw new ApiError(404, "tweetId is required")
    }
    if (!tweetContent || tweetContent.length() === 0) {
        throw new ApiError(404, "tweet content is requires")
    }
    try {
        const existedTweet = await Tweet.findById(tweetId)

        if (!existedTweet) {
            throw new ApiError(400, "Tweet doesn't exist")
        }
        // user is owner or not
        if (existedTweet.owner.toString() !== req.user?._id) {
            throw new ApiError(404,"Unauthorized Access")
        }
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

        return  res
        .status(200)
        .json(new ApiResponse(
            200,
            deletedTweet,
            "Tweet is deleted successfully"
        ))
    } catch (error) {
        throw new ApiError(400, "Error while deleting  the tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
