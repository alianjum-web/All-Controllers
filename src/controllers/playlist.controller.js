import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const isUserPlaylistOwner = async (userId, playlistId) => {
    try {
        const playlist = await Playlist.findById(playlistId)
        if (!playlist) {
            throw new ApiError(400, "playlist is not found")
        }
        if (playlist?.owner.toString() !== userId.toString()) {
            return false
        }

        return true
    } catch (error) {
        throw new ApiError(400, error.message || 'Playlist not found')
    }
}

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
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
                new ApiResponse
               ( 200,
                playlist,
                "Playlist is created successfully"
)
            )
    } catch (error) {
        throw new ApiError(401, "Playlist do not fetched successfully")
    }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    /*
    1.check for the userId
    2.find the user by the Model and check for it 
    3.than match the Playlist from the model name: Playlist by the userId through owner field
    4.than take values from the Playlist model by the $project
    5.see whatfield to take  from the model
    6.to take videos write the $cond and in in if($eq is used to compare the owner id and the req.user._id/requested user id
    7.if is true than run then(show all videos) otherwies else(only published videos are displayed) 
    8.check for the playlist and send res/return res
    )
    */
    if (!userId) {
        throw new ApiError(400, "userId not found")
    }

    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(400, "Failed to find user")
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
                    videos: {
                        $cond: {
                            if: { $eq: ["$owner", new mongoose.Types.ObjectId.createFromHexString(req?.user?._id)] },
                            then: "$videos",
                            else: {
                                $filter: {
                                    input: "$videos",
                                    as: "video",
                                    $cond: {
                                        $eq: { "$owner.isPublished": true }

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


});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400, "playlistId is not found")
    }

    try {
        const playlist = await Playlist.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    owner: 1,
                    videos: {
                        $cond: {
                            if: { $eq: [$owner, "new mongoose.Types.ObjectId(req.user?._id)"] },
                            than: "$videos",
                            else: {
                                $filter: {
                                    input: "$videos",
                                    as: "video",
                                    $cond: {
                                        $eq: ["$video.isPublished", true]
                                    }
                                }
                            }
                        }
                    },
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ])
        if (!playlist) {
            throw new ApiError(401, "Playlsit is not found")
        }

        return res
            .status(200)
            .json(
                200,
                playlist,
                "Playlist is fetched successfully"
            )
    } catch (error) {
        throw new ApiError(400, "Error while fetching the playlist")
    }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!videoId || !playlistId) {
        throw new ApiError(400, "playlistId and videoId are required!!!")
    }

    try {
        //currently authenticated user (represented by req.user._id) is the owner of the playlist with the specified playlistId.
        const isUserOwner = await isUserPlaylistOwner(playlistId, req?.user?._id)
        if (!isUserOwner) {
            throw new ApiError(400, "Unauthorized Accesss")
        }

        const video = await Video.findById(videoId)
        // if the video is not published and video owner and the current user are same than the owner can add video to playlist only
        if (!video || (!(video.owner.toString() === req.user?._id) && !video.isPublished)) {
            throw new ApiError(400, "Video is not found")
        }

        const playlist = await Playlist.findById(playlistId)

        if (playlist.videos.includes(videoId)) {
            return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    {},
                    "video already exist in the playlist"
                ))
        }

        const videoAdded = await Playlist.updateOne(
            {
                _id: mongoose.Types.ObjectId.createFormHexString(videoId)
            },
            {
                $push: {
                    "videos": videoId
                }
            }
        )

        if (!videoAdded) {
            throw new ApiError(402, "unable to add video in the playlist")
        }

        return res
            .status(200)
            .json(
                200,
                videoAdded,
                "video is added in the playlist successfully"
            )

    } catch (error) {
        throw new ApiError(500, "Video is not added due to internal server error")
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    /*
    1.check for the playlistId and videoId same if not throw error  if not present
    2.is the user is the owner of the playlist,check for it
    3.check that whether video is present actually or published or not 
    4.videos is addedd to palylist or not 
    5.if video is not published than remove it 
    6.if it is published than remove it 
    7.send the response at the end 
    
    */

    if (!playlistId || !videoId) {
        throw new ApiError(400, "playlistId and videoId are required")
    }

    const isUserOwner = await isUserPlaylistOwner(playlistId, req?.user?._id)

    if (!isUserOwner) {
        throw new ApiError(400, "Unauthorized Request")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "video is not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "playlist don't exist")
    }
    if (!playlist.videos.includes(playlistId)) {
        throw new ApiError(400, "No video found in the playlist")
    }

    if (!video.isPublished) {
        const videoRemovedFromPlaylist = await Playlist.updateOne(
            {
                _id: mongoose.Types.ObjectId.createFormHexString(playlistId)
            },
            {
                $pull: {
                    videos: mongoose.Types.ObjectId.createFormHexString(videoId)
                }
            }
        )

        if (!videoRemovedFromPlaylist) {
            throw new ApiError(400, "video is unable to removed from the playlist")
        }
        return res
            .status(200)
            .json(
                new ApiResponse
                    (200,{}, "video removed from the playlist successfully")
            )
    };

    const videoRemovedFromPlaylist = await Playlist.updateOne(
        {
            _id: mongoose.Types.ObjectId.createFromHexString(playlistId)
        },
        {
            $pull: {
                videos: videoId
            }
        }
    )
    if (!videoRemovedFromPlaylist) {
        throw new ApiError(403, "Published video is unable to remove from the playlist")
    }
    return res
    .staus(200)
    .json(
        new ApiResponse
        (200, videoRemovedFromPlaylist, "published video removed from the playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required!!!")
    }
    try {
        const isUserOwner = await isUserPlaylistOwner(playlistId, req?.user?._id)
        if (!isUserOwner) {
            throw new ApiError(400, "The user trying to delete playlist is not it's owner")
        }

        const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)
        if (!deletePlaylist) {
            throw new ApiError(500, "Unable to delete the playlist")
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            deletePlaylist,
            "Playlist is deleted successfully"
        ))
    } catch (error) {
        throw new ApiError(400, "Video is unable to delete")
    }
    

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    /*
    1.check for the playlistId
    2.user is the owner of the playlist,check for it
    3.check for name and description,check for it 
    4.findByIdAndUpdate use the playlist model and $set opertor
    
    */

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required")
    }
    try {
        const isUserOwner = await isUserPlaylistOwner(playlistId, req?.user?._id)
        if (!isUserOwner) {
            throw new ApiError(300, "Unauthorized Request")
        }
        if (!name || !description) {
            throw new ApiError(400, "name and description are required")
        }
    
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            {
                _id: playlistId,
            },    
            {
                $set: {
                    name: name,
                    description: description,
                }
            },
            {new: true}
        );
    
        if (!updatedPlaylist) {
            throw new ApiError(500, "Video is unable to update")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist is updated successfully"
        ))
    } catch (error) {
        throw new ApiError(400, error.message || "playlistId is not correct")
    }
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


/*
                                removeVideoFromPlaylist




                                pull methode in the db
 The output of **both** code snippets is **essentially the same**: they both remove a video with a specific `videoId` from the `videos` array within a playlist. However, they achieve this using different approaches:

1. **Code 1 (MongoDB Update):**
    - This code snippet uses MongoDB's `$pull` operator to directly modify the array in the database.
    - It updates the playlist document by removing the specified `videoId` from the `videos` array.
    - The change is persisted in the database.
    - It's efficient because the update happens at the database level.
    - Example usage:
      ```javascript
      db.playlists.update(
        { _id: playlistId },
        { $pull: { videos: videoId } }
      );
      ```

2. **Code 2 (JavaScript Filter):**
    - This code snippet operates on an array in memory (not directly on the database).
    - It filters the `videos` array in the `playlist` object (which is already loaded into memory).
    - It creates a new array that includes all video IDs except the one specified by `videoId`.
    - The original `playlist.videos` array remains unchanged; only the filtered result is assigned back to it.
    - It's less efficient because it requires loading the entire array into memory and creating a new array.
    - Example usage:
      ```javascript
      playlist.videos = playlist.videos.filter((video) => video.toString() !== videoId);
      ```

In summary, both approaches achieve the same goal, but the choice between them depends on your specific use case and whether you want to modify the database directly or work with in-memory data. Choose the one that best fits your application's requirements! 🚀



                              filter methode

I understand that the `filter` method can be a bit tricky at first. Let me explain it in a simpler way:

Imagine you have a basket of fruits, and you want to remove all the apples from it. What you would do is take each fruit, check if it's an apple, and if it's not, you put it into a new basket. In the end, the new basket will have all the fruits except the apples.

Now, let's apply this to your code:

```javascript
playlist.videos = playlist.videos.filter((video) => video.toString() !== videoId);
```

Here, `playlist.videos` is like your basket of fruits, and `videoId` is like the apple you want to remove. The `filter` function goes through each `video` (fruit) in the `playlist.videos` array (basket) and checks:

- Is this `video` **not** the `videoId` (apple) we want to remove?
- If yes (it's not an apple), keep it in the new array (new basket).
- If no (it is an apple), remove it from the array (don't put it in the new basket).

In the end, `playlist.videos` will be a new array that has all the original videos except for the one with the `videoId` you wanted to remove.

So, the `filter` method helps you create a new list that only includes items that meet a certain condition. In your case, the condition is "the video ID should not be equal to the `videoId` we want to remove."

I hope this explanation makes it clearer! If you have any more questions, feel free to ask. 🌟
*/