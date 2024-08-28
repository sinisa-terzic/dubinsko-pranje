$(document).ready(function () {

    $("#nanogallery2").nanogallery2({
        // ### gallery settings ### 
        // "thumbnailHeight": 300,
        // "thumbnailWidth": 400,
        // "galleryLastRowFull": true,
        galleryMaxRows: 2,
        galleryDisplayMode: 'rows',
        gallerySorting: 'random',
        thumbnailDisplayOrder: 'random',

        thumbnailWidth: '300',
        thumbnailHeight: '200',
        "thumbnailBorderVertical": 0,
        "thumbnailBorderHorizontal": 0,

        // thumbnailAlignment: 'scaled',
        // thumbnailGutterWidth: 0, thumbnailGutterHeight: 0,
        // thumbnailBorderHorizontal: 0, thumbnailBorderVertical: 0,

        // thumbnailToolbarImage: null,
        // thumbnailToolbarAlbum: null,
        // thumbnailLabel: { display: false },

        // DISPLAY ANIMATION
        // for gallery
        galleryDisplayTransitionDuration: 1500,
        // for thumbnails
        thumbnailDisplayTransition: 'imageSlideUp',
        thumbnailDisplayTransitionDuration: 1200,
        thumbnailDisplayTransitionEasing: 'easeInOutQuint',
        thumbnailDisplayInterval: 60,

        // THUMBNAIL HOVER ANIMATION
        thumbnailBuildInit2: 'image_scale_1.15',
        thumbnailHoverEffect2: [{ name: 'image_scale_1.00_1.20', duration: 500 }],

        // LIGHTBOX
        viewerToolbar: { display: false },
        viewerTools: {
            // topLeft: 'label, shareButton, rotateLeft, rotateRight',
            topRight: 'shareButton, rotateLeft, rotateRight, fullscreenButton, closeButton'
        },

        galleryTheme: {
            thumbnail: { background: '#fff', Borderheight: '0' }
        },
        viewerTheme: { background: 'rgba(0, 0, 0, 0.9)' },

        // ### gallery content ### 
        items: [
            { src: '../img/gallery/1200x800/1.jpg', srct: '../img/gallery/1.jpg' },
            { src: '../img/gallery/1200x800/2.jpg', srct: '../img/gallery/2.jpg' },
            { src: '../img/gallery/1200x800/3.jpg', srct: '../img/gallery/3.jpg' },
            { src: '../img/gallery/1200x800/4.jpg', srct: '../img/gallery/4.jpg' },
            { src: '../img/gallery/1200x800/5.jpg', srct: '../img/gallery/5.jpg' },
            { src: '../img/gallery/1200x800/6.jpg', srct: '../img/gallery/6.jpg' },
            { src: '../img/gallery/1200x800/7.jpg', srct: '../img/gallery/7.jpg' },
            { src: '../img/gallery/1200x800/8.jpg', srct: '../img/gallery/8.jpg' },
            { src: '../img/gallery/1200x800/9.jpg', srct: '../img/gallery/9.jpg' },
            { src: '../img/gallery/1200x800/10.jpg', srct: '../img/gallery/10.jpg' },
            { src: '../img/gallery/1200x800/11.jpg', srct: '../img/gallery/11.jpg' },
            { src: '../img/gallery/1200x800/12.jpg', srct: '../img/gallery/12.jpg' },
            { src: '../img/gallery/1200x800/13.jpg', srct: '../img/gallery/13.jpg' },
            { src: '../img/gallery/1200x800/14.jpg', srct: '../img/gallery/14.jpg' }
        ]
    });
});