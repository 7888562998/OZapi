import multer from "multer"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//File Filters

const FilterDocs = function (req, file, cb) {
  console.log(file)
  const allowedTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/plain",
    "application/vnd.oasis.opendocument.text",
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only document and text files are allowed"));
  }
};

const FilterVideos = function (req, file, cb) {
  const allowedTypes = ["video/mp4", "video/mpeg", "video/quicktime"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4, MPEG, and Quicktime videos are allowed"));
  }
};



const FilterMagazine = function (req, file, cb) {
  //const allowedTypes = ["application/pdf", "application/epub+zip", "video/quicktime"];

  const allowedTypes = [
    "application/pdf",
    "application/epub+zip",
    "application/x-mobipocket-ebook",
    "application/vnd.comicbook+zip",
    "application/vnd.comicbook-archive",
    "application/vnd.ms-xpsdocument",
    "application/vnd.amazon.ebook",
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4, MPEG, and Quicktime videos are allowed"));
  }
};


const FilterEvents = function (req, file, cb) {
  //const allowedTypes = ["application/pdf", "application/epub+zip", "video/quicktime"];

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Images are allowed"));
  }
};







const uploadDocs = multer({ storage: storage, fileFilter: FilterDocs });
const uploadVideos = multer({ storage: storage, fileFilter: FilterVideos });
const uploadMagazine = multer({ storage: storage, fileFilter: FilterMagazine });
const uploadEvents = multer({ storage: storage, fileFilter: FilterEvents });



const UploadFilter = {
  uploadDocs,
  uploadVideos,
  uploadMagazine,
  uploadEvents
};

export default UploadFilter;
