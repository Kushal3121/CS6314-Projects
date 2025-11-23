// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from 'mongoose';

/**
 * Activity schema records user actions for the activity feed.
 * type: 'photo_upload' | 'comment_added' | 'user_register' | 'user_login' | 'user_logout'
 * Optionally includes photo context to show a thumbnail for photo-related activities.
 */
const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  date_time: { type: Date, default: Date.now },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  // For photo-related activities, store the photo to display a thumbnail
  photo_id: { type: mongoose.Schema.Types.ObjectId },
  photo_file_name: { type: String },
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;


