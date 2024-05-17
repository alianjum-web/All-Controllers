import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    /*
    1.find the user by req.user use User model
    2.check for the user and channelId
    3.make credential it includes userId and channelId
    4.find the credential in tryCatch by the findOne
    5.if statement not subscribed than create methode to create the new subcription by the credentils
    6.else deleteOne methode 
    */

    if (!channelId) {
        throw new ApiError(400, "channelId is required!!!")
    }
    const userId = req.user?._id
    const credentials = {subscriber:userId,channel: channelId}

    try {
        const subscribed = await Subscription.findOne(credentials)
         
        if (!subscribed) {  //Not subscribed:- delete the exiteing one
            const newSubcription = await Subscription.create(credentials)
            if (!newSubcription) {
                throw new ApiError(400, "Error while subscribing")
            }
            return res

            .status(200)
            .json(
                new ApiResponse(200, newSubcription, "User subscribed successfully")
            )
        } else {
            if (subscribed) { //channel is subscribed:- delete the existing one 
                const deletedSubscription = await Subscription.deleteOne(credentials);
                if (!deletedSubscription) {
                    throw new ApiError(500, "Unable to subscribe the channel")
                }
                return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        deletedSubscription,
                        "channel unsubscribed  successfully"
                    )
                )
            }
        }
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Subscription toggled succcessfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Unable to toggled subscription")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    /*
    1.check for the channelId
    2.$match on the basis of it
    3.group the document by giving _id to $channel
    4. $push the subscrbers
    5.take vslues by $project
    6.send response
    7.tryCatch error
    */
try {
       if (!channelId) {
        throw new ApiError(400, "channelId is required")
       }
       const subscribers = await Subscription.aggregate([{
        $match: {
            channel:  mongoose.Types.ObjectId.createFromHexString(channelId)
        },
       },
       {
        $group: { 
            _id: "$channel",  // Group by the channel field
            subscribers: {$push: "$subscriber"}  //// Collect subscribers for each channel
        }
       },
       {
       $project: {
        _id: 0,
        subscribers: 1
       }
       }
    ])
    
    if (!subscribers || subscribers.length === 0) {
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            [],
            "There are no subscribers for the channnel"
        )
    
        )
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscribers,
        "subscriber list obtained successfully"
    ))
} catch (error) {
    throw new ApiError(400, error?.message || "Unsble to fetch subscribers")
    
}
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
try {
        const { subscriberId } = req.params
    
        if (!subscriberId) {
            throw new ApiError(400, "subscriberId is required")
        }
    
        const subscribedChannels = await Subscription.aggregate([
            {
                $match: { //match by the subsciberId because we are finding the channels for a single subscriber
                    subscriber: new mongoose.Types.ObjectId.createFromHexString(subscriberId)
                }
            },{
                $group: { // gorup by channel because subscribed different channel
                    _id: "$subscriber",
                    subscribedChannels: {$push: "$channel"}
                }
            },
            {
                $project: {  //what field to take
                    _id: 0,
                    subscribedChannels: 1
                }
            }
        ])
    
        if (!subscribedChannels || subscribedChannels.length === 0) {
            return res
            .status(200)
            .json(new ApiResponse(
                200,
                [],
                "User don't subscribed to any channel"
            ))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            subscribedChannels,
            "All the channels whom the user are subscribed are found successfullly"
        ))
} catch (error) {
    throw new ApiError(
        500,error?.message ||  "Unable to sfetch subscribers"
    )
}

});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

/*
                          const credentials = {subscriber:userId,channel: channelId}

these lines of code are creating an object named credentials that holds the user’s ID and the channel’s ID. This object could then be used to manage the subscription status of the user for that channel, such as adding or removing the channel from the user’s list of subscriptions in the database.



                                  $push   operator
The '$push' operator is used for updating arrays in MongoDB. It lets you add new elements to an existing array within a document. Here's a breakdown of its functionality:

Adding Elements: '$push' inserts one or more elements to the end of the target array by default.
Creating New Array: If the field you're targeting isn't already an array, '$push' creates a new array with the specified elements.
Adding Multiple Elements: You can use the '$each' modifier with '$push' to add multiple elements at once, instead of appending the entire array as a single element.
Specifying Position (Optional): With the '$position' modifier, you can insert elements at a specific index within the array.


  


                           count the subscriber for the particular channel

To count the number of subscribers for a particular channel in your MongoDB aggregation pipeline, you can use the `$sum` operator within the `$group` stage. This operator will increment a counter each time a document matches the group criteria. Here's how you can modify your `$group` stage to include a count of subscribers:

```javascript
{
    $group: {
        _id: "$channel", // Group by the channel field
        subscriberCount: { $sum: 1 }, // Count the number of subscribers
        subscribers: { $push: "$subscriber" } // Optional: Collect subscribers' IDs
    }
}
```

In this modified `$group` stage, `subscriberCount` will hold the total number of subscribers for each channel. If you only need the count and not the list of subscriber IDs, you can omit the `subscribers` field.

Here's how your complete aggregation pipeline would look with the subscriber count:

```javascript
const subscribers = await Subscription.aggregate([
    {
        $match: {
            channel: mongoose.Types.ObjectId(channelId)
        }
    },
    {
        $group: {
            _id: "$channel",
            subscriberCount: { $sum: 1 }
        }
    },
    {
        $project: {
            _id: 0,
            subscriberCount: 1
        }
    }
]);
```

This pipeline will give you the count of subscribers for the specified channel. If the `subscriberCount` is zero, it means there are no subscribers for that channel. You can then use this count in your response to the client, similar to how YouTube displays the number of subscribers for a channel. 😊                                
*/