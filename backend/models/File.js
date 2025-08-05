const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    File_originalName: {
      type: String,
      required: true,
    },
    File_url: {
      type: String,
      required: true,
    },
    File_type: {
      type: String,
      required: true,
      enum: ["image", "document", "video", "audio", "other"],
    },
    File_size: {
      type: Number,
      required: true,
    },
    File_uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    File_messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true,
    },
    File_groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true,
    },
    File_createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: "File_createdAt",
      currentTime: () => new Date(),
    },
  }
);

// Index for efficient queries
FileSchema.index({ File_uploadedBy: 1, File_createdAt: -1 });
FileSchema.index({ File_groupId: 1, File_createdAt: -1 });
FileSchema.index({ File_groupId: 1, File_type: 1 });

// Virtual for file extension
FileSchema.virtual("File_extension").get(function () {
  return this.File_originalName.split(".").pop().toLowerCase();
});

// Virtual for human readable file size
FileSchema.virtual("File_sizeFormatted").get(function () {
  const bytes = this.File_size;
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Ensure virtual fields are serialized
FileSchema.set("toJSON", { virtuals: true });
FileSchema.set("toObject", { virtuals: true });

const File = mongoose.model("File", FileSchema);

module.exports = File;
