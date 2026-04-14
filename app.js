const { useState, useEffect, useMemo, useRef } = React;

// التوابع الأساسية
const ls = {
    get: (key, defaultValue) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value))
};

const uid = () => Math.random().toString(36).substring(2, 10);
const formatPrice = (price) => price.toLocaleString('ar-SY') + " ل.س";

// إعدادات البوت - غيّر هذه القيم حسب بوتك
const BOT_TOKEN = "8727549999:AAEPGB7tvc7HYf2OViD34HanwJBSc3jkOEU"; // ضع توكن البوت هنا
const BOT_USERNAME = "@idlebstore_bot"; // مثال: @MyShopBot

// البيانات الافتراضية
const defaultSettings = {
    whatsappNumber: "963900000000",
    shopName: "IDLEB X",
    adminPwd: "idlebx-admin",
    discountCode: "CYBER10",
    discountPercent: 10,
    botToken: BOT_TOKEN,
    botUsername: BOT_USERNAME,
    enableBot: true  // تفعيل البوت
};

const defaultCategories = [
    { id: "cat1", name: "اختبار الاختراق", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400", description: "أدوات اختبار الاختراق", order: 1 },
    { id: "cat2", name: "OSINT", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400", description: "جمع المعلومات", order: 2 },
    { id: "cat3", name: "VPN", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "حماية الشبكات", order: 3 },
    { id: "cat4", name: "منتجات رقمية", image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400", description: "دورات وكتب", order: 4 },
    { id: "cat5", name: "أجهزة", image: "https://images.unsplash.com/photo-1597225244661-8cfb5ddb0f8e?w=400", description: "أجهزة هاكينغ", order: 5 }
];

const defaultProducts = [
    { id: "p1", categoryId: "cat1", name: "Kali Linux Pro Kit", priceSYP: 450000, description: "نسخة مخصصة من كالي مع 200+ أداة", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400", downloadLink: "https://t.me/your_channel/kali_pro_kit", createdAt: Date.now(), stock: 999, isDigital: true, rating: 4.9, views: 1243 },
    { id: "p2", categoryId: "cat1", name: "Burp Suite Pro License", priceSYP: 1250000, description: "رخصة سنة كاملة", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400", downloadLink: "https://t.me/your_channel/burp_pro", createdAt: Date.now(), stock: 25, isDigital: true, rating: 5.0, views: 892 },
    { id: "p3", categoryId: "cat2", name: "حزمة OSINT Master", priceSYP: 320000, description: "50 أداة OSINT", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400", downloadLink: "https://t.me/your_channel/osint_master", createdAt: Date.now(), stock: 999, isDigital: true, rating: 4.7, views: 756 },
    { id: "p4", categoryId: "cat3", name: "VPN Lifetime", priceSYP: 850000, description: "اشتراك مدى الحياة", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", downloadLink: "https://t.me/your_channel/vpn_lifetime", createdAt: Date.now(), stock: 100, isDigital: true, rating: 4.8, views: 2104 },
    { id: "p5", categoryId: "cat4", name: "دورة اختراق أخلاقي", priceSYP: 680000, description: "35 ساعة فيديو", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400", downloadLink: "https://t.me/your_channel/hacking_course", createdAt: Date.now(), stock: 999, isDigital: true, rating: 4.9, views: 3421 },
    { id: "p6", categoryId: "cat5", name: "Flipper Zero", priceSYP: 2750000, description: "جهاز Flipper Zero", image: "https://images.unsplash.com/photo-1597225244661-8cfb5ddb0f8e?w=400", downloadLink: "", createdAt: Date.now(), stock: 7, isDigital: false, rating: 5.0, views: 5432 }
];

// دالة إرسال الطلب إلى البوت
const sendToBot = async (userId, product, amount) => {
    const settings = ls.get("idlebx:settings", defaultSettings);
    if (!settings.enableBot || !settings.botToken) {
        return { success: false, error: "البوت غير مفعل" };
    }
    
    // تخزين طلب الشراء مؤقتاً
    const pendingPurchases = ls.get("idlebx:pending", []);
    const purchaseId = uid();
    const newPurchase = {
        id: purchaseId,
        userId: userId,
        productId: product.id,
        productName: product.name,
        amount: amount,
        status: "pending",
        createdAt: Date.now(),
        downloadLink: product.downloadLink
    };
    pendingPurchases.push(newPurchase);
    ls.set("idlebx:pending", pendingPurchases);
    
    // محاولة إرسال إشعار للبوت (يتم التعامل معه من طرف البوت)
    try {
        const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: userId,
                text: `🛍️ طلب شراء جديد!\n\n📦 المنتج: ${product.name}\n💰 السعر: ${formatPrice(amount)}\n🆔 رقم الطلب: ${purchaseId}\n\n⚠️ يرجى إرسال /confirm_${purchaseId} بعد تأكيد الدفع.\n\nلإلغاء الطلب: /cancel_${purchaseId}`,
                parse_mode: "HTML"
            })
        });
        const data = await response.json();
        return { success: true, purchaseId: purchaseId, botResponse: data };
    } catch (error) {
        console.error("خطأ في إرسال الطلب للبوت:", error);
        return { success: false, error: error.message };
    }
};

// دالة التحقق من حالة الشراء
const checkPurchaseStatus = (purchaseId) => {
    const pending = ls.get("idlebx:pending", []);
    const purchase = pending.find(p => p.id === purchaseId);
    if (purchase && purchase.status === "completed") {
        // حذف الطلب بعد اكتماله
        const updated = pending.filter(p => p.id !== purchaseId);
        ls.set("idlebx:pending", updated);
        return { completed: true, downloadLink: purchase.downloadLink };
    }
    if (purchase && purchase.status === "cancelled") {
        const updated = pending.filter(p => p.id !== purchaseId);
        ls.set("idlebx:pending", updated);
        return { completed: false, cancelled: true };
    }
    return { completed: false, pending: true };
};

// المكون الرئيسي
function App() {
    const [settings, setSettings] = useState(() => ls.get("idlebx:settings", defaultSettings));
    const [categories, setCategories] = useState(() => ls.get("idlebx:categories", defaultCategories));
    const [products, setProducts] = useState(() => ls.get("idlebx:products", defaultProducts));
    const [activeCat, setActiveCat] = useState("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("new");
    const [cart, setCart] = useState(() => ls.get("idlebx:cart", []));
    const [wishlist, setWishlist] = useState(() => ls.get("idlebx:wishlist", []));
    const [cartOpen, setCartOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [discountCode, setDiscountCode] = useState("");
    const [adminOpen, setAdminOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(() => ls.get("idlebx:auth", false));
    const [adminTab, setAdminTab] = useState("products");
    const [purchaseStatus, setPurchaseStatus] = useState(null);
    const [userId, setUserId] = useState(() => ls.get("idlebx:user_id", ""));
    const [showUserIdModal, setShowUserIdModal] = useState(false);
    
    // نماذج الإدارة
    const [newCatName, setNewCatName] = useState("");
    const [newCatDesc, setNewCatDesc] = useState("");
    const [newCatImg, setNewCatImg] = useState("");
    const [newProdName, setNewProdName] = useState("");
    const [newProdPrice, setNewProdPrice] = useState("");
    const [newProdDesc, setNewProdDesc] = useState("");
    const [newProdImg, setNewProdImg] = useState("");
    const [newProdCat, setNewProdCat] = useState("");
    const [newProdStock, setNewProdStock] = useState("999");
    const [newProdDigital, setNewProdDigital] = useState(true);
    const [newProdRating, setNewProdRating] = useState("4.5");
    const [newProdLink, setNewProdLink] = useState("");
    
    const pwdRef = useRef(null);
    const userIdRef = useRef(null);
    const clickCount = useRef(0);
    const clickTimer = useRef(null);
    const checkInterval = useRef(null);

    // حفظ البيانات
    useEffect(() => { ls.set("idlebx:settings", settings); }, [settings]);
    useEffect(() => { ls.set("idlebx:categories", categories); }, [categories]);
    useEffect(() => { ls.set("idlebx:products", products); }, [products]);
    useEffect(() => { ls.set("idlebx:cart", cart); }, [cart]);
    useEffect(() => { ls.set("idlebx:wishlist", wishlist); }, [wishlist]);
    useEffect(() => { ls.set("idlebx:auth", isAuth); }, [isAuth]);
    useEffect(() => { if (userId) ls.set("idlebx:user_id", userId); }, [userId]);

    // تصفية المنتجات
    const filteredProducts = useMemo(() => {
        let list = [...products];
        if (activeCat !== "all") list = list.filter(p => p.categoryId === activeCat);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        if (sortBy === "price-asc") list.sort((a, b) => a.priceSYP - b.priceSYP);
        else if (sortBy === "price-desc") list.sort((a, b) => b.priceSYP - a.priceSYP);
        else if (sortBy === "popular") list.sort((a, b) => b.views - a.views);
        else list.sort((a, b) => b.createdAt - a.createdAt);
        return list;
    }, [products, activeCat, search, sortBy]);

    const categoriesSorted = [...categories].sort((a, b) => a.order - b.order);
    
    const cartTotal = cart.reduce((sum, item) => {
        const p = products.find(x => x.id === item.id);
        return sum + (p ? p.priceSYP * item.qty : 0);
    }, 0);
    
    const discount = discountCode.toUpperCase() === settings.discountCode.toUpperCase() ? settings.discountPercent : 0;
    const finalTotal = cartTotal * (1 - discount / 100);

    // دوال السلة
    const addToCart = (productId) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === productId);
            if (existing) return prev.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { id: productId, qty: 1 }];
        });
        setCartOpen(true);
    };
    
    const updateQty = (productId, qty) => {
        if (qty <= 0) setCart(prev => prev.filter(i => i.id !== productId));
        else setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
    };
    
    const toggleWishlist = (id) => {
        setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    
    const incrementView = (id) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, views: p.views + 1 } : p));
    };

    // دالة الشراء عبر البوت
    const purchaseViaBot = async (product) => {
        if (!userId) {
            setShowUserIdModal(true);
            return;
        }
        
        setPurchaseStatus({ loading: true, product: product.name });
        
        const result = await sendToBot(userId, product, product.priceSYP);
        
        if (result.success) {
            setPurchaseStatus({
                success: true,
                message: `✅ تم إرسال طلب شراء ${product.name} إلى البوت!\nرقم الطلب: ${result.purchaseId}\nالرجاء مراجعة البوت لإتمام الدفع.`,
                purchaseId: result.purchaseId
            });
            
            // بدء التحقق من حالة الدفع
            checkInterval.current = setInterval(() => {
                const status = checkPurchaseStatus(result.purchaseId);
                if (status.completed && status.downloadLink) {
                    clearInterval(checkInterval.current);
                    setPurchaseStatus({
                        success: true,
                        completed: true,
                        message: `🎉 تم تأكيد الدفع! يمكنك الآن تحميل المنتج: ${product.name}`,
                        downloadLink: status.downloadLink
                    });
                } else if (status.cancelled) {
                    clearInterval(checkInterval.current);
                    setPurchaseStatus({
                        error: true,
                        message: `❌ تم إلغاء طلب شراء ${product.name}`
                    });
                }
            }, 5000); // التحقق كل 5 ثواني
            
            setTimeout(() => {
                if (checkInterval.current) clearInterval(checkInterval.current);
            }, 300000); // إيقاف التحقق بعد 5 دقائق
        } else {
            setPurchaseStatus({
                error: true,
                message: `❌ فشل إرسال الطلب: ${result.error}\nالرجاء المحاولة مرة أخرى أو التواصل مع الدعم.`
            });
        }
        
        setTimeout(() => {
            setPurchaseStatus(null);
        }, 15000);
    };

    // دوال الإدارة
    const addCategory = () => {
        if (!newCatName.trim()) return alert("أدخل اسم القسم");
        const newCat = {
            id: uid(),
            name: newCatName,
            image: newCatImg || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400",
            description: newCatDesc || "",
            order: categories.length + 1
        };
        setCategories([...categories, newCat]);
        setNewCatName(""); setNewCatDesc(""); setNewCatImg("");
        alert("تم إضافة القسم");
    };
    
    const deleteCategory = (id) => {
        if (!confirm("حذف القسم سيحذف جميع منتجاته؟")) return;
        setCategories(categories.filter(c => c.id !== id));
        setProducts(products.filter(p => p.categoryId !== id));
        if (activeCat === id) setActiveCat("all");
    };
    
    const addProduct = () => {
        if (!newProdName.trim()) return alert("أدخل اسم المنتج");
        const priceNum = parseInt(newProdPrice);
        if (isNaN(priceNum)) return alert("أدخل سعر صحيح");
        
        const newProduct = {
            id: uid(),
            name: newProdName,
            priceSYP: priceNum,
            description: newProdDesc || "",
            image: newProdImg || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400",
            downloadLink: newProdLink || "",
            categoryId: newProdCat || categories[0]?.id,
            createdAt: Date.now(),
            stock: parseInt(newProdStock) || 999,
            isDigital: newProdDigital,
            rating: parseFloat(newProdRating) || 4.5,
            views: 0
        };
        setProducts([newProduct, ...products]);
        setNewProdName(""); setNewProdPrice(""); setNewProdDesc(""); setNewProdImg(""); setNewProdLink("");
        setNewProdStock("999"); setNewProdDigital(true); setNewProdRating("4.5");
        alert("تم إضافة المنتج");
    };
    
    const deleteProduct = (id) => {
        if (!confirm("هل تريد حذف هذا المنتج؟")) return;
        setProducts(products.filter(p => p.id !== id));
        setCart(cart.filter(i => i.id !== id));
    };
    
    const updateProductLink = (id, link) => {
        setProducts(products.map(p => p.id === id ? { ...p, downloadLink: link } : p));
    };

    // فتح لوحة التحكم
    const logoSecret = () => {
        clickCount.current++;
        if (clickTimer.current) clearTimeout(clickTimer.current);
        clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 3000);
        if (clickCount.current >= 5) {
            setAdminOpen(true);
            clickCount.current = 0;
        }
    };
    
    useEffect(() => {
        const handleKey = (e) => {
            if (e.altKey && e.shiftKey && e.key.toLowerCase() === "a") setAdminOpen(true);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);
    
    const login = () => {
        const pwd = pwdRef.current?.value || "";
        if (pwd === settings.adminPwd) {
            setIsAuth(true);
            setAdminOpen(true);
        } else {
            alert("كلمة مرور خاطئة");
        }
    };
    
    const logout = () => {
        setIsAuth(false);
        setAdminOpen(false);
    };

    const saveUserId = () => {
        const id = userIdRef.current?.value || "";
        if (id) {
            setUserId(id);
            setShowUserIdModal(false);
            alert("تم حفظ معرف التليجرام!");
        } else {
            alert("الرجاء إدخال معرف التليجرام الخاص بك");
        }
    };

    // روابط واتساب (للاحتياط)
    const getWhatsAppLink = (product) => {
        const cat = categories.find(c => c.id === product.categoryId);
        const msg = `مرحباً ${settings.shopName} 👋

أرغب بشراء المنتج التالي:

📦 *${product.name}*
🏷️ القسم: ${cat?.name || ''}
💰 السعر: ${formatPrice(product.priceSYP)}
${product.isDigital ? '⚡ تسليم فوري رقمي' : '📦 منتج فيزيائي'}
⭐ التقييم: ${product.rating}/5

📝 الوصف:
${product.description}

الرجاء تزويدي بطريقة الدفع والاستلام.`;
        return `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    };

    // JSX
    return (
        <div>
            {/* مودال إدخال معرف التليجرام */}
            {showUserIdModal && (
                <div className="admin-panel" style={{ zIndex: 3000 }}>
                    <div className="admin-container" style={{ maxWidth: '400px' }}>
                        <div className="admin-header">
                            <h3>🤖 تفعيل الشراء عبر البوت</h3>
                            <button className="login-btn" onClick={() => setShowUserIdModal(false)}>✕</button>
                        </div>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ marginBottom: '20px' }}>للشراء عبر بوت التليجرام، الرجاء إدخال معرفك في التليجرام:</p>
                            <input 
                                type="text" 
                                ref={userIdRef} 
                                className="search-input" 
                                placeholder="مثال: @username أو 123456789"
                                style={{ width: '100%', marginBottom: '20px' }}
                            />
                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
                                💡 يمكنك الحصول على معرفك من إعدادات التليجرام أو عن طريق مراسلة @userinfobot
                            </p>
                            <button className="btn-primary" onClick={saveUserId}>تأكيد</button>
                        </div>
                    </div>
                </div>
            )}

            {/* رسالة حالة الشراء */}
            {purchaseStatus && (
                <div className="admin-panel" style={{ zIndex: 3000 }}>
                    <div className="admin-container" style={{ maxWidth: '450px' }}>
                        <div className="admin-header">
                            <h3>{purchaseStatus.success ? '✅ شراء ناجح' : (purchaseStatus.error ? '❌ فشل الشراء' : '⏳ جاري المعالجة')}</h3>
                            <button className="login-btn" onClick={() => setPurchaseStatus(null)}>✕</button>
                        </div>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ whiteSpace: 'pre-line' }}>{purchaseStatus.message}</p>
                            {purchaseStatus.completed && purchaseStatus.downloadLink && (
                                <a href={purchaseStatus.downloadLink} target="_blank" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                                    📥 تحميل المنتج
                                </a>
                            )}
                            {purchaseStatus.loading && (
                                <div style={{ marginTop: '20px' }}>
                                    <div className="loading-spinner"></div>
                                    <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>جاري انتظار تأكيد الدفع...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* الهيدر - نفس السابق */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo" onClick={logoSecret}>
                            <div className="logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor"/>
                                </svg>
                            </div>
                            <div>
                                <div className="logo-text">
                                    <span>IDLEB</span><span>X</span>
                                </div>
                                <div className="logo-badge">CYBER ARSENAL</div>
                            </div>
                        </div>
                        
                        <div className={`search-area ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="ابحث في المنتجات..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="new">الأحدث</option>
                                <option value="popular">الأكثر مشاهدة</option>
                                <option value="price-asc">السعر: منخفض</option>
                                <option value="price-desc">السعر: مرتفع</option>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {userId && (
                                <div style={{ background: '#10b98120', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>🤖</span>
                                    <span>{userId.length > 15 ? userId.substring(0, 12) + '...' : userId}</span>
                                </div>
                            )}
                            <button className="cart-button" onClick={() => setCartOpen(true)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M6 6h15l-1.5 8.5H7.5L6 6zM9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                                </svg>
                                {cart.length > 0 && <span className="cart-count">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
                            </button>
                            <button className="menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* الهيرو */}
            <div className="container">
                <div className="hero">
                    <h1>ترسانة الهاكر الأخلاقي <span>بين يديك</span></h1>
                    <p>أدوات اختبار اختراق، دورات احترافية، أجهزة هاكينغ، وحلول VPN مشفرة</p>
                    <a href="#products" className="btn-primary">تصفح الأدوات</a>
                </div>

                {/* الأقسام */}
                <h2 className="section-title">
                    الأقسام
                    <span style={{ fontSize: '12px', color: '#71717a' }}>{categories.length} أقسام</span>
                </h2>
                <div className="categories-grid">
                    <div className={`category-card ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')}>
                        <div className="category-card-content">
                            <h3>✨ الكل</h3>
                            <p>جميع المنتجات</p>
                        </div>
                    </div>
                    {categoriesSorted.map(cat => (
                        <div key={cat.id} className={`category-card ${activeCat === cat.id ? 'active' : ''}`} onClick={() => setActiveCat(cat.id)}>
                            <img src={cat.image} alt={cat.name} />
                            <div className="category-card-content">
                                <h3>{cat.name}</h3>
                                <p>{cat.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* المنتجات */}
                <h2 className="section-title" id="products">
                    {activeCat === 'all' ? 'جميع المنتجات' : categories.find(c => c.id === activeCat)?.name}
                    <span style={{ fontSize: '12px', color: '#71717a' }}>{filteredProducts.length} منتج</span>
                </h2>
                
                {filteredProducts.length === 0 ? (
                    <div className="empty-state">
                        <p>لا توجد منتجات مطابقة للبحث</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {filteredProducts.map(product => {
                            const inWishlist = wishlist.includes(product.id);
                            const cat = categories.find(c => c.id === product.categoryId);
                            return (
                                <div key={product.id} className="product-card">
                                    <div className="product-image">
                                        <img src={product.image} alt={product.name} />
                                        <div className="product-badges">
                                            {product.isDigital && <span className="badge-digital">رقمي</span>}
                                            {product.stock < 10 && !product.isDigital && <span className="badge-stock">باقي {product.stock}</span>}
                                        </div>
                                        <button className={`wishlist-btn ${inWishlist ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)}>
                                            {inWishlist ? '❤️' : '🤍'}
                                        </button>
                                        <div className="product-stats">
                                            <span className="stat">⭐ {product.rating}</span>
                                            <span className="stat">👁 {product.views}</span>
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <div className="product-title">{product.name}</div>
                                        <div className="product-desc">{product.description}</div>
                                        <div className="product-category">{cat?.name}</div>
                                        <div className="product-price">{formatPrice(product.priceSYP)}</div>
                                        <div className="product-actions">
                                            {settings.enableBot && product.isDigital ? (
                                                <button className="btn-buy" onClick={() => purchaseViaBot(product)} style={{ background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    🤖 شراء عبر البوت
                                                </button>
                                            ) : (
                                                <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="btn-buy" onClick={() => incrementView(product.id)}>
                                                    📞 طلب عبر واتساب
                                                </a>
                                            )}
                                            <button className="btn-cart" onClick={() => addToCart(product.id)}>
                                                🛒
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* سلة التسوق - نفس السابق */}
            <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)}></div>
            <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>🛒 سلة التسوق</h3>
                    <button className="close-cart" onClick={() => setCartOpen(false)}>✕</button>
                </div>
                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <p>السلة فارغة</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const p = products.find(x => x.id === item.id);
                            if (!p) return null;
                            return (
                                <div key={item.id} className="cart-item">
                                    <img src={p.image} alt={p.name} />
                                    <div className="cart-item-info">
                                        <div className="cart-item-title">{p.name}</div>
                                        <div className="cart-item-price">{formatPrice(p.priceSYP)}</div>
                                        <div className="cart-item-actions">
                                            <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                                            <span>{item.qty}</span>
                                            <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                                            <button className="remove-item" onClick={() => updateQty(item.id, 0)}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="discount-box">
                            <div className="discount-input">
                                <input type="text" placeholder="كود الخصم" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
                                <button onClick={() => {}}>تطبيق</button>
                            </div>
                            {discount > 0 && <div className="discount-message">✓ تم تطبيق خصم {discount}%</div>}
                        </div>
                        <div className="cart-total">
                            <div className="total-row"><span>المجموع</span><span>{formatPrice(cartTotal)}</span></div>
                            {discount > 0 && <div className="total-row"><span>الخصم ({discount}%)</span><span>-{formatPrice(cartTotal - finalTotal)}</span></div>}
                            <div className="total-row grand-total"><span>الإجمالي</span><span>{formatPrice(finalTotal)}</span></div>
                        </div>
                        <a href={getWhatsAppLink({ name: "الطلب الكامل", priceSYP: finalTotal, description: cart.map(i => `${i.qty}x ${products.find(p=>p.id===i.id)?.name}`).join(', ') })} target="_blank" className="whatsapp-checkout">
                            📱 إتمام الطلب عبر واتساب
                        </a>
                        <button className="clear-cart" onClick={() => setCart([])}>تفريغ السلة</button>
                    </div>
                )}
            </div>

            {/* لوحة التحكم - نفس السابق مع إضافة إعدادات البوت */}
            {adminOpen && (
                <div className="admin-panel">
                    <div className="admin-container">
                        <div className="admin-header">
                            <h3>⚙️ لوحة تحكم IDLEB X</h3>
                            <div className="login-area">
                                {!isAuth ? (
                                    <>
                                        <input type="password" ref={pwdRef} className="login-input" placeholder="كلمة المرور" onKeyPress={(e) => e.key === 'Enter' && login()} />
                                        <button className="login-btn" onClick={login}>دخول</button>
                                    </>
                                ) : (
                                    <button className="login-btn" onClick={logout}>خروج</button>
                                )}
                                <button className="login-btn" onClick={() => setAdminOpen(false)}>✕</button>
                            </div>
                        </div>
                        
                        {!isAuth ? (
                            <div className="empty-state">
                                <p>🔐 أدخل كلمة المرور للدخول إلى لوحة التحكم</p>
                                <p style={{ fontSize: '12px', marginTop: '10px' }}>كلمة المرور الافتراضية: <strong>idlebx-admin</strong></p>
                            </div>
                        ) : (
                            <>
                                <div className="admin-tabs">
                                    <button className={`admin-tab ${adminTab === 'products' ? 'active' : ''}`} onClick={() => setAdminTab('products')}>المنتجات</button>
                                    <button className={`admin-tab ${adminTab === 'categories' ? 'active' : ''}`} onClick={() => setAdminTab('categories')}>الأقسام</button>
                                    <button className={`admin-tab ${adminTab === 'settings' ? 'active' : ''}`} onClick={() => setAdminTab('settings')}>الإعدادات</button>
                                    <button className={`admin-tab ${adminTab === 'bot' ? 'active' : ''}`} onClick={() => setAdminTab('bot')}>🤖 البوت</button>
                                </div>
                                
                                {adminTab === 'products' && (
                                    <>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>➕ إضافة منتج جديد</h4>
                                            <div className="form-row">
                                                <div className="form-group"><label>اسم المنتج</label><input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} /></div>
                                                <div className="form-group"><label>السعر (ل.س)</label><input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} /></div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group"><label>القسم</label>
                                                    <select value={newProdCat} onChange={(e) => setNewProdCat(e.target.value)}>
                                                        <option value="">اختر القسم</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group"><label>المخزون</label><input type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} /></div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group"><label>التقييم</label><input type="number" step="0.1" value={newProdRating} onChange={(e) => setNewProdRating(e.target.value)} /></div>
                                                <div className="form-group"><label>رابط الصورة</label><input type="text" value={newProdImg} onChange={(e) => setNewProdImg(e.target.value)} placeholder="https://..." /></div>
                                            </div>
                                            <div className="form-group"><label>رابط التحميل (للمنتجات الرقمية)</label><input type="text" value={newProdLink} onChange={(e) => setNewProdLink(e.target.value)} placeholder="https://t.me/..." /></div>
                                            <div className="form-group"><label>الوصف</label><textarea rows="2" value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)}></textarea></div>
                                            <div className="form-group"><label><input type="checkbox" checked={newProdDigital} onChange={(e) => setNewProdDigital(e.target.checked)} /> منتج رقمي</label></div>
                                            <button className="btn-submit" onClick={addProduct}>إضافة المنتج</button>
                                        </div>
                                        
                                        <div className="items-list">
                                            <h4 style={{ marginBottom: '15px' }}>📦 المنتجات الحالية ({products.length})</h4>
                                            {products.map(p => {
                                                const cat = categories.find(c => c.id === p.categoryId);
                                                return (
                                                    <div key={p.id} className="list-item">
                                                        <div className="list-item-info">
                                                            <h4>{p.name}</h4>
                                                            <p>{cat?.name} • {formatPrice(p.priceSYP)} • {p.isDigital ? 'رقمي' : 'فيزيائي'}</p>
                                                            {p.downloadLink && <p style={{ fontSize: '11px', color: '#10b981' }}>رابط التحميل: {p.downloadLink.substring(0, 30)}...</p>}
                                                        </div>
                                                        <div className="list-item-actions">
                                                            <button className="delete-btn" onClick={() => deleteProduct(p.id)}>حذف</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                                
                                {adminTab === 'categories' && (
                                    <>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>➕ إضافة قسم جديد</h4>
                                            <div className="form-group"><label>اسم القسم</label><input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} /></div>
                                            <div className="form-group"><label>الوصف</label><input type="text" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} /></div>
                                            <div className="form-group"><label>رابط الصورة</label><input type="text" value={newCatImg} onChange={(e) => setNewCatImg(e.target.value)} placeholder="https://..." /></div>
                                            <button className="btn-submit" onClick={addCategory}>إضافة القسم</button>
                                        </div>
                                        
                                        <div className="items-list">
                                            <h4 style={{ marginBottom: '15px' }}>📁 الأقسام الحالية ({categories.length})</h4>
                                            {categories.map(c => (
                                                <div key={c.id} className="list-item">
                                                    <div className="list-item-info">
                                                        <h4>{c.name}</h4>
                                                        <p>{c.description}</p>
                                                    </div>
                                                    <div className="list-item-actions">
                                                        <button className="delete-btn" onClick={() => deleteCategory(c.id)}>حذف</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                
                                {adminTab === 'settings' && (
                                    <div>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>⚙️ إعدادات المتجر</h4>
                                            <div className="form-group"><label>رقم الواتساب</label><input type="text" value={settings.whatsappNumber} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} /></div>
                                            <div className="form-group"><label>كود الخصم</label><input type="text" value={settings.discountCode} onChange={(e) => setSettings({ ...settings, discountCode: e.target.value.toUpperCase() })} /></div>
                                            <div className="form-group"><label>نسبة الخصم (%)</label><input type="number" value={settings.discountPercent} onChange={(e) => setSettings({ ...settings, discountPercent: Math.min(90, Math.max(0, parseInt(e.target.value) || 0)) })} /></div>
                                            <div className="form-group"><label>كلمة مرور الإدارة</label><input type="text" value={settings.adminPwd} onChange={(e) => setSettings({ ...settings, adminPwd: e.target.value })} /></div>
                                        </div>
                                        <div className="info-box">
                                            <strong>🔑 كيفية الدخول للوحة التحكم:</strong><br/>
                                            • اضغط 5 مرات بسرعة على شعار IDLEB X<br/>
                                            • أو اضغط Alt + Shift + A<br/>
                                            • كلمة المرور: {settings.adminPwd}
                                        </div>
                                    </div>
                                )}
                                
                                {adminTab === 'bot' && (
                                    <div>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>🤖 إعدادات بوت التليجرام</h4>
                                            <div className="form-group">
                                                <label>توكن البوت (Bot Token)</label>
                                                <input type="text" value={settings.botToken} onChange={(e) => setSettings({ ...settings, botToken: e.target.value })} placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" />
                                                <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>احصل على التوكن من @BotFather في التليجرام</p>
                                            </div>
                                            <div className="form-group">
                                                <label>اسم المستخدم للبوت</label>
                                                <input type="text" value={settings.botUsername} onChange={(e) => setSettings({ ...settings, botUsername: e.target.value })} placeholder="@MyShopBot" />
                                            </div>
                                            <div className="form-group">
                                                <label><input type="checkbox" checked={settings.enableBot} onChange={(e) => setSettings({ ...settings, enableBot: e.target.checked })} /> تفعيل البوت</label>
                                            </div>
                                        </div>
                                        
                                        <div className="info-box">
                                            <strong>📖 شرح إعداد البوت:</strong><br/><br/>
                                            1️⃣ اذهب إلى <strong>@BotFather</strong> في التليجرام<br/>
                                            2️⃣ أرسل <code>/newbot</code> لإنشاء بوت جديد<br/>
                                            3️⃣ اختر اسم للبوت ثم اسم مستخدم ينتهي بـ <strong>bot</strong><br/>
                                            4️⃣ بعد الإنشاء، ستحصل على <strong>Token</strong> - انسخه والصقه في الحقل أعلاه<br/><br/>
                                            <strong>⚠️ ملاحظة:</strong> البوت يحتاج إلى برنامج منفصل يعمل على خادم (Node.js/Python) لمعالجة الدفعات والرصيد. هذا المتجر يرسل الطلبات فقط، وعملية الخصم والتسليم تحتاج إلى بوت منفصل.
                                        </div>
                                        
                                        <div className="admin-form" style={{ marginTop: '20px' }}>
                                            <h4 style={{ marginBottom: '15px' }}>📦 طلبات الشراء المعلقة</h4>
                                            <div className="items-list">
                                                {ls.get("idlebx:pending", []).filter(p => p.status === "pending").map(p => (
                                                    <div key={p.id} className="list-item">
                                                        <div className="list-item-info">
                                                            <h4>{p.productName}</h4>
                                                            <p>المستخدم: {p.userId} • المبلغ: {formatPrice(p.amount)}</p>
                                                            <p style={{ fontSize: '11px' }}>رقم الطلب: {p.id}</p>
                                                        </div>
                                                        <div className="list-item-actions">
                                                            <button className="edit-btn" style={{ background: '#10b981', color: 'black' }} onClick={() => {
                                                                const updated = ls.get("idlebx:pending", []).map(pp => pp.id === p.id ? { ...pp, status: "completed" } : pp);
                                                                ls.set("idlebx:pending", updated);
                                                                alert(`تم تأكيد طلب ${p.productName}`);
                                                                window.location.reload();
                                                            }}>تأكيد الدفع</button>
                                                            <button className="delete-btn" onClick={() => {
                                                                const updated = ls.get("idlebx:pending", []).map(pp => pp.id === p.id ? { ...pp, status: "cancelled" } : pp);
                                                                ls.set("idlebx:pending", updated);
                                                                alert(`تم إلغاء طلب ${p.productName}`);
                                                                window.location.reload();
                                                            }}>إلغاء</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {ls.get("idlebx:pending", []).filter(p => p.status === "pending").length === 0 && (
                                                    <p className="empty-state" style={{ padding: '20px' }}>لا توجد طلبات معلقة</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* الفوتر */}
            <footer className="footer">
                <div className="container">
                    <p>IDLEB X - متجر متخصص في أدوات السايبر سكيورتي والاختراق الأخلاقي</p>
                    <p style={{ marginTop: '10px' }}>جميع المنتجات للاستخدام التعليمي والقانوني فقط © {new Date().getFullYear()}</p>
                </div>
            </footer>
            
            <style>{`
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #27272a;
                    border-top: 3px solid #10b981;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// تشغيل التطبيق
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
