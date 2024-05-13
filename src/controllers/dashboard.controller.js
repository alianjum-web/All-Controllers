import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    /*
   1. get the userId by req.user
   2. Aggregation pipeline on the Video collection and match on the basis of userId
   3.left-out-joint on the localfield(likes) collection to the video collection(_id):foriegnfield as  likes
   4.left-out-joint with the owner of the video to channel in the subscription
   5.use group and gave totalSubscribers,totalVideos,totalViews,totalLikes and totoalSubscribers
   6.use project and extract values
           
   */

   const userId = req.user?._id
   try {
    const channelStat = await Video.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId.createFromHexString(userId)
            }
        },
        {
            $lookup: {
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"Likes"
            }
        },
        {
            $lookup: {
                from:"subscriptions",
                localField:"owner",
                foreignField:"channel",
                as:"Subscribers"
            }
        },
        {
            $group: {
                _id:null,
                TotalVideos: { $sum:1 },
                TotalViews: { $sum:1 },
                TotalSubscribers: { $first: { $size: "$Subscribers" } },
                TotalLikes: { $sum: { $size: "$Likes" } }
            }
        },
        {
            $project: {
                _id:0,
                TotalVideos:1,
                TotalViews:1,
                TotalSubscribers:1,
                TotalLikes:1,
            }
        }
    ])

    if (!channelStat) {
        throw new ApiError(404,"Error while fetching the channel Status")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channelStat,
        "channelStatus is obtained successfully"
    ))

   } catch (error) {
    throw new ApiError(400,"Error while fetching the channel status")
   }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id
    try {
        const videos = await Video.find({owner:userId})
        if (!videos || videos.length() === 0) {
            return res
            .status(200)
            .json(new ApiResponse(200,videos,"No video published yet"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200,videos,"All published videos of the channel fetched successfully"))
    } catch (error) {
        
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }