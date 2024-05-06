import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const isUserPlaylistOwner = async(userId, playlistId) => {
   try {
     const playlist = await Playlist.findById(userId)
 if (!playlist) {
     throw new ApiError(400, "playlist is not found")
 }
 if(playlist?.owner.toString() !== userId.toString()) {
     return false
 }
 
 return true
   } catch (error) {
    throw new ApiError(400, error.message || 'Playlist not found')
   }
}

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
if (!name) {
    throw new ApiError(401, "name is required")
}

let playlistDescription = description || ""
    //TODO: create playlist
try {
    const playlist = await Playlist.create({
        name,
        description: playlistDescription,
        owner: req.user?._id,
        videos: []
    })
    
    if (!playlist) {
        throw new ApiError(401, "Something went wrong while making the playlist")
    }

    return res
    .status(200)
    .josn(
        200,
        playlist,
        "Playlist is created successfully"
    
    )
} catch (error) {
    throw new ApiError(401, "Playlist do not fetched successfully")
}
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "userId not found")
    }

    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(400, 'Failed to find user')
        }

        const playlist = await Playlist.aggregate([
            {
                $match: {
                    owner: user._id,
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    owner: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    videos:{
                        $cond:{
                            if:{$eq:["$owner",new mongoose.Types.ObjectId(req?.user?._id)]},
                            then:"$videos",
                            else:{
                                $filter: {
                                    input: "$videos",
                                    as: video,
                                    $cond: {
                                       $eq :{"$owner.isPublished": true}
                                
                                    }
                                }
                            
                            }
                        }
                    }
                }
            }

        ])

        if (!playlist) {
            throw new ApiError(401, "Error while fetching the playlist")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
            200,
            playlist,
            'Playlist is formed successfully'
    ))

    } catch (error) {
        throw new ApiError(401, "Failed to obtain playlist")
    }


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

/*

I apologize for any confusion. Let me clarify the usage of `user?._id` and `req.user?._id` in the provided code snippet:

1. **`user?._id`**:
   - The `user?._id` expression uses the optional chaining operator (`?`) along with the `_id` property.
   - It is equivalent to `user && user._id`.
   - If `user` is `null` or `undefined`, the entire expression evaluates to `undefined`.
   - If `user` is not `null` or `undefined`, it accesses the `_id` property of the `user` object.

2. **`req.user?._id`**:
   - Similarly, `req.user?._id` uses optional chaining to access the `_id` property of the `req.user` object.
   - If `req.user` is `null` or `undefined`, the entire expression evaluates to `undefined`.
   - If `req.user` is not `null` or `undefined`, it accesses the `_id` property of the `req.user` object.

3. **Comparison**:
   - Both expressions are used to access the `_id` property of an object (either `user` or `req.user`).
   - The choice between them depends on the context and how you handle user authentication and authorization in your application.
   - If `req.user` represents the currently authenticated user, then `req.user._id` is more appropriate.
   - If you're working with a different user (not necessarily the authenticated user), then `user._id` might be used.

In summary, both expressions serve the same purpose of accessing the `_id` property, but they are used in different contexts. Choose the one that aligns with your specific use case and authentication flow. 🚀









The line of code you provided is part of a MongoDB aggregation pipeline. Let's break it down:

1. **`$eq`**:
   - The `$eq` operator stands for "equals" and is used for equality comparison within aggregation pipelines.
   - It compares two expressions and returns `true` if they are equal, and `false` otherwise.
   - In this case, it compares the value of the first expression (which is the field `"owner"`) with the value of the second expression (which is the user's `_id` converted to a MongoDB ObjectId).

2. **`["$owner", new mongoose.Types.ObjectId(req?.user?._id)]`**:
   - This expression consists of an array with two elements:
     - The first element is the field path `"owner"`. It refers to the value of the `"owner"` field in the current document.
     - The second element is the user's `_id` (from `req.user._id`) converted to a MongoDB ObjectId using `new mongoose.Types.ObjectId(...)`.
   - The `$eq` operator compares these two elements for equality.

3. **Purpose**:
   - The purpose of this expression is to check whether the `"owner"` field in the document matches the user's `_id`.
   - If they are equal, it indicates that the user is the owner of the document (e.g., a playlist owned by the user).
   - If they are not equal, it implies that the user does not own the document.

In summary, this line of code is used to filter documents based on ownership, ensuring that only documents owned by the specified user are considered in the aggregation pipeline. 🚀
*/