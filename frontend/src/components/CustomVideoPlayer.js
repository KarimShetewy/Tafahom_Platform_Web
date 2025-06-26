import React, { useRef, useState, useEffect, useCallback } from 'react';
import './CustomVideoPlayer.css'; // استيراد ملف الأنماط

const CustomVideoPlayer = ({ src }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true); // لإظهار/إخفاء عناصر التحكم
    const controlsTimeoutRef = useRef(null); // للتحكم في إخفاء عناصر التحكم

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setCurrentTime(videoRef.current.currentTime); // للتأكد من تحديث الوقت الحالي
            setVolume(videoRef.current.volume);
            setIsMuted(videoRef.current.muted);
        }
    };

    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        if (videoRef.current && !isNaN(newTime)) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current && !isNaN(newVolume)) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
            // إذا قمنا بكتم الصوت، اضبط مستوى الصوت على 0 في الـ UI، والعكس
            if (videoRef.current.muted) {
                setVolume(0);
            } else {
                // استعادة مستوى الصوت السابق إذا لم يكن 0، وإلا اضبطه على 1
                setVolume(videoRef.current.volume || 1);
            }
        }
    };
    
    // لإدارة إظهار/إخفاء عناصر التحكم
    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) { // إخفاء فقط إذا كان الفيديو يعمل
                setShowControls(false);
            }
        }, 3000); // إخفاء بعد 3 ثوانٍ من عدم وجود حركة
    }, [isPlaying]);

    const handleMouseLeave = useCallback(() => {
        if (isPlaying && !videoRef.current.paused) { // إخفاء بمجرد مغادرة الماوس إذا كان الفيديو يعمل
            setShowControls(false);
        }
    }, [isPlaying]);

    // لتهيئة مستمعات الأحداث
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('ended', () => setIsPlaying(false)); // عند انتهاء الفيديو

            // منع قائمة السياق (right-click menu)
            video.addEventListener('contextmenu', (e) => e.preventDefault());

            // منع خاصية التنزيل المدمجة في المتصفح
            video.controlsList = 'nodownload';
            if ('disablePictureInPicture' in video) {
                video.disablePictureInPicture = true; // منع Picture-in-Picture
            }
            
            // تهيئة حالة البدء
            setDuration(video.duration || 0);
            setCurrentTime(video.currentTime || 0);
            setVolume(video.volume || 1);
            setIsMuted(video.muted || false);
        }

        // تنظيف مستمعات الأحداث عند إزالة المكون
        return () => {
            if (video) {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('ended', () => setIsPlaying(false));
                video.removeEventListener('contextmenu', (e) => e.preventDefault());
            }
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [isPlaying]); // يعتمد على isPlaying لتحديث سلوك إظهار/إخفاء عناصر التحكم

    const formatTime = (time) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div 
            className="custom-video-player-container" 
            onMouseMove={handleMouseMove} 
            onMouseLeave={handleMouseLeave}
            // منع النقرة اليمنى على الحاوية بأكملها
            onContextMenu={(e) => e.preventDefault()}
        >
            <video
                ref={videoRef}
                src={src}
                controls={false} // تعطيل عناصر التحكم الافتراضية للمتصفح
                onDoubleClick={togglePlayPause} // تشغيل/إيقاف مؤقت بالنقر المزدوج
                className="custom-video-element"
            >
                متصفحك لا يدعم تشغيل الفيديو.
            </video>

            <div className={`custom-video-controls ${showControls ? 'visible' : ''}`}>
                <div className="controls-row">
                    <button onClick={togglePlayPause} className="play-pause-btn">
                        {isPlaying ? '⏸️' : '▶️'}
                    </button>

                    <div className="progress-bar-wrapper">
                        <input
                            type="range"
                            min="0"
                            max={duration}
                            value={currentTime}
                            step="0.1"
                            onChange={handleProgressChange}
                            className="progress-bar"
                        />
                        <span className="time-display">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="volume-controls">
                        <button onClick={toggleMute} className="mute-btn">
                            {isMuted || volume === 0 ? '🔇' : '🔊'}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            value={isMuted ? 0 : volume}
                            step="0.01"
                            onChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>
                </div>
            </div>
            <p className="security-note">ملاحظة: حماية الفيديو من التسجيل الكامل للشاشة صعبة جداً من خلال الويب.</p>
        </div>
    );
};

export default CustomVideoPlayer;
