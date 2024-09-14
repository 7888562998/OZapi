import { Schema, model } from 'mongoose'

const NotificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        image: {
            type: Schema.Types.ObjectId,
            ref: 'Media',
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    },
)

const NotificationsModel = model('Notification', NotificationSchema)

export default NotificationsModel
