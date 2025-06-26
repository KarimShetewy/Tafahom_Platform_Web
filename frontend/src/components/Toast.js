import React, { useState, useEffect } from 'react';
import './Toast.css';

function Toast({ message, type, onDismiss, toastCallback }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            if (type === 'confirm') {
                setIsConfirming(true);
            } else {
                setIsConfirming(false);
                const timer = setTimeout(() => {
                    setIsVisible(false);
                    onDismiss();
                }, 5000); // إخفاء تلقائي بعد 5 ثوانٍ للرسائل غير التأكيدية
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
            setIsConfirming(false);
        }
    }, [message, type, onDismiss]);

    const handleConfirm = (action) => {
        setIsVisible(false);
        setIsConfirming(false);
        if (toastCallback) {
            toastCallback(action === 'confirm');
        }
        onDismiss(); // مسح الرسالة من الـ App state
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`toast-container ${isVisible ? 'show' : ''} ${type}`}>
            <div className="toast-message">
                <p>{message}</p>
                {isConfirming && (
                    <div className="toast-actions">
                        <button onClick={() => handleConfirm('confirm')} className="btn-toast confirm">نعم</button>
                        <button onClick={() => handleConfirm('cancel')} className="btn-toast cancel">إلغاء</button>
                    </div>
                )}
            </div>
            {!isConfirming && <button onClick={() => { setIsVisible(false); onDismiss(); }} className="toast-dismiss-btn">×</button>}
        </div>
    );
}

export default Toast;
