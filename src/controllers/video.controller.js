import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const queryObject = {}
    if (query) {
        queryObject.$text = { $search: query }
    }

    if (userId) {
        queryObject.owner = userId
    }

    let sortCriteria = {}
    if (sortBy && sortType) {
        sortCriteria[sortBy] = sortType === 'desc' ? -1 : 1;
    }

    const skip = (page - 1) * limit
    try {
        const videos = await Video.find(queryObject, null, { sort: sortCriteria, skip, limit })

        res.json({
            videos,
            totalCount: Video.countDocuments(queryObject)
        })
    } catch (error) {
        res.status(500).json({ message: "Error Fetching Video" })
    }


});


const publishAVideo = asyncHandler(async (req, res) => {

        const { title, description } = req.body
        // TODO: get video, upload to cloudinary, create video
        
        if (!title || !thumbnail) {
            throw new ApiError(500, "Title And Video file are missing")
        }
        
        // retieve video and thumbnail
        const videoLocalPath = req.files?.video[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0].path
        
        if (!videoLocalPath) {
            throw new ApiError(500, "video is required!!!")
        }
        if (!thumbnailLocalPath) {
            throw new ApiError(500, "thumnail is required!!!")
        }
// cloud upload
        const video = await uploadOnCloudinary(videoLocalPath)
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!video?.url) {
            throw new ApiError(401, "Something happened while uploading the video")
        }
        if (!thumbnail?.url) {
            throw new ApiError(401, "Something happened while uploading the thumnail")
        }
// create a new video document(req.user,stores login of the user)
        const newVideo = await Video.create({
            videoFile: video.url,
            thumbnail: thumbnail.url,
            title,
            description,
            duration: video?.duration,
            views: video?.views,
            isPublished: true,
            owner: req.user._id
        })
        res
        .status(200)
        .json(new ApiResponse(200, newVideo, "newVideo Published successfully"))
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
 if (!videoId) {
    throw new ApiError(404,"Video is required")
 }
try {
     const video = await Video.findById(videoId)
    
     if (!video || (!video.isPublished && !(owner?.owner === req.uer._id))) {
        throw new ApiError(500, "Video is not found")
     }
} catch (error) {
    throw new ApiError(500, "Something went wrong while finding video")
}

 return res.
 status(200)
 .json(new ApiResponse(200, video, {message: "Video is obtained"}))


});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
const { title, description, thumbnail} = req.body
if (!title || !description || !thumbnail) {
    throw new ApiError("title,description and thumbnail are required")
}

const video = await Video.findOneAndUpdate(
    req.video?._id,
    {
        $set: {
            title,
            description,
            thumbnail
        }
    },{new: true }

)
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
