
import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const isUserOwner = async (videoId, req) => {
    const video = await Video.findById(videoId)

    if(video?.owner !== req.user?._id) {
        return false
    }
    return true
}

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
        
        if (!title || !description) {
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
    
     if (!video || !video.isPublished && !(video?.owner.toString() === req.uer?._id.toString())) {
        throw new ApiError(500, "Video is not found")
     }
} catch (error) {
    throw new ApiError(500, "Something went wrong while finding video")
}
return res
.status(200)
.json(new ApiResponse(200,"Video fetched Successfully"))
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
// check for the videoId
    if (!videoId) {
        throw new ApiError(403, "videoId not found")
    }

if (!isUserOwner(videoId, req)) { //req.user gave us id of the requested person, owner's id is from db(videoId)

    throw new ApiError(402, "Unauthorized Accesss !!!")
}
//TODO: update video details like title, description, thumbnail
    const thumbnailLocalPath = req.files?.path
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(404, "thumbnail is required")
    }
const { title, description} = req.body

  // Check if all required fields are provided
if (!title || !description) {
    throw new ApiError(401, "title,description and thumbnail are required")
}

const video = await Video.findByIdAndUpdate(
    { 
        _id: videoId  // Use videoId from params to find the video
    },
    {           
        $set: {       //update values
            title,
            description,
            thumbnail
        }
    },
    {new: true }   // Return the updated document
);


  // Check if the video was found and updated
if (!video) {
    throw new ApiError(401, "video is required")
}

return res
.status(200)
.json(new ApiResponse(200, "Video Updated Successfully"))


/*   above approach is done by the below code also

 // Find the video by ID
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  // Update the video details
  video.title = title || video.title;
  video.description = description || video.description;
  video.thumbnail = thumbnail || video.thumbnail;

  // Save the updated video
  const updatedVideo = await video.save();

*/
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(402, "videoID is required!!!")
    }
    if (!isUserOwner(videoId, req)) {
        throw new ApiError(401, "Unauthorized Request")
    }
     //TODO: delete video from db
const videoDeleted = await Video.findByIdAndDelete(videoId)
    if (!videoDeleted) {
        throw new ApiError(401, "video is required")
    }

   await fs.unlink('../public/temp')  // detele file from server,destination stored in db for file on server

return res
.status(200)
.json(
    200, "video deleted successfully"
)
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(401, "videoID is required")
    }
    
    if (!isUserOwner(videoId, req)) {
        throw new ApiError(401, "Unauthorizeed request")
    }

  try {
      const video = await Video.findById(videoId)
      if (!video) {
          throw new ApiError(401, "video is required!!")
      }
  
      video.isPublished = !video.isPublished;
      await video.save()
      
      return res
      .status(200)
      .json(new ApiResponse(
          200,
          video,
          "PublishedStatus of the video is toggled successfully"
      ))
  } catch (error) {
    throw new ApiError(402, "Internal server error while toggling the video")
  }


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}


/*
If video.Published is currently true, applying ! to it will make it false.
If video.Published is currently false, applying ! to it will make it true.
Combining these two elements, !video.Published will invert the current value of video.Published. If it's true, ! will make it false, and if it's false, ! will make it true.


The $not operator effectively inverts the current value of isPublished, achieving the desired toggle functionality.
const updatevideo = await Video.findByIdAndUpdate(videoId, { $set: isPublished: {$not: "$isPublished"} })

*/