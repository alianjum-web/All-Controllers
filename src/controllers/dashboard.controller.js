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
                TotalViews: { $sum: "$views" },
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



/*                                   $first and  $sum                                

I understand that the use of `$first` and `$sum` in MongoDB aggregation can be a bit confusing. Let's clarify when to use each:

- **`$first`**: Use this operator when you are certain that all documents within each group have the same value for the field you're interested in. It's efficient because it takes the value from the first document in the group and ignores the rest. In your case, since the number of subscribers is constant for a channel, `$first` is appropriate for `TotalSubscribers`.

- **`$sum`**: Use this operator when you want to add up values across documents within a group. This is ideal for fields where the values can vary from document to document. In your case, since the number of likes can differ for each video, `$sum` is the correct choice for `TotalLikes`.

Here's a simple rule of thumb:
- If the field's value is the **same** for all documents in the group, use `$first`.
- If the field's value can be **different** for documents in the group, use `$sum`.

In summary:
- **Use `$first`** for fields that are the same across all documents in a group (like `TotalSubscribers` in your case).
- **Use `$sum`** for fields that need to be added up across all documents in a group (like `TotalLikes` for individual videos).

I hope this helps clarify the usage! If you have any more questions or need further assistance, feel free to ask. 😊





                                    $sum and $count
That's correct! In MongoDB's aggregation framework:

- **`$sum`** is used to add up numerical values across documents. For example, if you have a collection of fruits with documents like `{ fruit: "apple", price: 20 }` and `{ fruit: "banana", price: 30 }`, using `$sum` on the `price` field would give you the total price of all fruits combined, which in this case would be **50**.

- **`$count`** is used to count the number of documents that match a certain condition or simply to count all documents in a collection if no condition is specified. So, if you're counting the documents in the fruit category and you have two documents (one for an apple and one for a banana), `$count` would give you **2**.

Here's how you might use these operators in an aggregation pipeline:

```javascript
db.collection.aggregate([
    { $match: { category: "fruit" } },
    { $group: {
        _id: "$category",
        TotalPrice: { $sum: "$price" },
        TotalItems: { $count: {} }
    }}
]);
```

This pipeline would output a document like:

```javascript
{
    "_id": "fruit",
    "TotalPrice": 50,
    "TotalItems": 2
}
```

It shows the total price of all items in the `fruit` category and the total count of items in that category. The `_id` field in the `$group` stage is used to specify the grouping key, which is the `category` field in this example. If you have any more questions or need further clarification, feel free to ask! 😊





                                        Dashbord

Certainly, let's break down the provided aggregation pipeline code step by step:

**1. `$match` Stage:**

- **Purpose:** Filters the documents in the `Video` collection based on a specific criteria.
- **Breakdown:**
    - `owner: new mongoose.Types.ObjectId(userId)`: This expression filters videos where the `owner` field matches a MongoDB ObjectID generated using the provided `userId`. The `new mongoose.Types.ObjectId(userId)` part ensures you're creating a valid ObjectID for the comparison.

**2. `$lookup` Stages (x2):**

- **Purpose:** Performs a join-like operation to retrieve data from related collections. This pipeline uses two `$lookup` stages to fetch information from two different collections:
    - **First `$lookup`:**
        - `from: "likes"`: Specifies the collection to join with, which is "likes" in this case.
        - `localField: "_id"`: The field in the current collection (videos) that will be used for the join. Here, it's the video's `_id`.
        - `foreignField: "video"`: The field in the "likes" collection that contains the reference to the video.
        - `as: "Likes"`: An alias assigned to the joined data, which will be an array of like documents for each video.
    - **Second `$lookup`:**
        - `from: "subscriptions"`: Specifies the collection to join with, which is "subscriptions" in this case.
        - `localField: "owner"`: The field in the current collection (videos) that will be used for the join. Here, it's the video owner's ID.
        - `foreignField: "channel"`: The field in the "subscriptions" collection that contains the reference to the channel.
        - `as: "Subscribers"`: An alias assigned to the joined data, which will be an array of subscriber documents for each video.

**3. `$group` Stage:**

- **Purpose:** Groups the documents and performs aggregation operations on the grouped data.
- **Breakdown:**
    - `_id: null`: Sets the group's `_id` field to `null`. Since you're calculating channel-level statistics, you likely don't need individual document grouping.
    - `TotalVideos: { $sum: 1 }`: Calculates the total number of videos by summing 1 for each document in the group (effectively counting the documents).
    - `TotalViews: { $sum: "$views" }`: Calculates the total number of views across all videos by summing the `views` field from each video document.
    - `TotalSubscribers: { $first: { $size: "$Subscribers" } }`:
        - `$size: "$Subscribers"`: Gets the number of subscribers (array length) for the current video.
        - `$first`: Since you're likely fetching videos for a single user (based on `userId`), this retrieves the subscriber count from the first video in the (assumed) single-document group. This assumes documents are coming in a predictable order (be cautious if order is not guaranteed).
    - `TotalLikes: { $first: { $size: "$Likes" } }`: Similar to `TotalSubscribers`, this retrieves the like count from the first video's `Likes` array.

**4. `$project` Stage:**

- **Purpose:** Selects the desired fields to include in the final output documents.
- **Breakdown:**
    - `_id: 0`: Excludes the `_id` field (set to `null` in the `$group` stage) from the final output.
    - `TotalSubscribers: 1`: Includes the `TotalSubscribers` field in the output.
    - `TotalLikes: 1`: Includes the `TotalLikes` field in the output.
    - `TotalVideos: 1`: Includes the `TotalVideos` field in the output.
    - `TotalViews: 1`: Includes the `TotalViews` field in the output.

**Overall, this aggregation pipeline calculates channel statistics for the user specified by `userId`. It retrieves all videos owned by the user, performs joins to fetch likes and subscriber data, and then calculates:**

- Total number of videos
- Total number of views across all videos
- Total number of subscribers (using the subscriber count from the first video)
- Total number of likes (using the like count from the first video)

**Cautions:**

- The code assumes documents are fetched in a predictable order for using `$first`. If order is not guaranteed, consider sorting beforehand.
- Using `$first` on potentially empty arrays (`Likes` or `Subscribers`) might                                        
*/    