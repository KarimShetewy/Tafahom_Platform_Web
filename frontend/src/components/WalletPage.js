import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';
import './WalletPage.css';

function WalletPage() {
    const { user, setUser } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);

    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const userToken = user?.token;

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
        if (errors.amount) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors.amount;
                return newErrors;
            });
        }
    };

    const handleChargeWallet = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setErrors({ amount: 'الرجاء إدخال مبلغ صحيح وموجب.' });
            showGlobalToast('الرجاء إدخال مبلغ صحيح وموجب.', 'error');
            setLoading(false);
            return;
        }

        showGlobalToast(
            `هل أنت متأكد من شحن محفظتك بمبلغ ${parsedAmount.toFixed(2)} جنيه؟`,
            'confirm',
            async (confirmed) => {
                if (confirmed) {
                    try {
                        const response = await axios.post('http://127.0.0.1:8000/api/users/charge-wallet/', {
                            amount: parsedAmount
                        }, {
                            headers: {
                                'Authorization': `Token ${userToken}`
                            }
                        });

                        const newBalance = response.data.new_balance;
                        setUser(prevUser => ({ ...prevUser, balance: newBalance }));
                        sessionStorage.setItem('userBalance', newBalance.toString());
                        
                        setAmount(''); // Clear the input field
                        showGlobalToast(response.data.message, 'success');

                    } catch (err) {
                        console.error("Charge wallet error:", err.response ? err.response.data : err.message);
                        let errorMessage = 'فشل شحن المحفظة. يرجى المحاولة مرة أخرى.';
                        if (axios.isAxiosError(err) && err.response && err.response.data) {
                            if (err.response.data.detail) {
                                errorMessage = err.response.data.detail;
                            } else if (typeof err.response.data === 'object') {
                                errorMessage = Object.values(err.response.data).map(msg => Array.isArray(msg) ? msg.join(', ') : msg).join(' | ');
                            }
                        }
                        setErrors({ general: errorMessage });
                        showGlobalToast(errorMessage, 'error');
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setLoading(false); // If not confirmed, stop loading state
                }
            }
        );
    };

    if (!user || user.userType !== 'student') {
        return (
            <div className="wallet-page">
                <main className="main-content">
                    <div className="container dashboard-container">
                        <p className="error-message-box">ليس لديك صلاحية للوصول إلى المحفظة.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="wallet-page">
            <main className="main-content">
                <div className="container wallet-container">
                    <h1>محفظتي</h1>
                    <div className="wallet-summary-card">
                        <h3>رصيدك الحالي:</h3>
                        <p className="current-balance">{(user.balance ?? 0).toFixed(2)} جنيه</p>
                    </div>

                    <section className="charge-wallet-section">
                        <h2>شحن المحفظة</h2>
                        {errors.general && <div className="error-message-box">{errors.general}</div>}
                        <form onSubmit={handleChargeWallet} className="charge-wallet-form">
                            <div className="form-group">
                                <label htmlFor="amount">المبلغ:</label>
                                <input
                                    type="text" // Use text to control input for decimal
                                    id="amount"
                                    name="amount"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="أدخل المبلغ بالجنيه"
                                    required
                                />
                                {errors.amount && <span className="error-message">{errors.amount}</span>}
                            </div>
                            <button type="submit" disabled={loading} className="btn btn-primary charge-btn">
                                {loading ? 'جاري الشحن...' : 'شحن الرصيد الآن'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
            <footer>
                <div className="container">
                    <p>&copy; 2025 تفاهم. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        </div>
    );
}

export default WalletPage;
