const { useState, useEffect, useMemo, useRef } = React;

// ============== LocalStorage Helper ==============
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

// ============== Default Data ==============
const defaultSettings = {
    whatsappNumber: "963900000000",
    shopName: "IDLEB X",
    adminPwd: "idlebx-admin",
    discountCode: "CYBER10",
    discountPercent: 10,
    botToken: "",
    botUsername: "idlebstore_bot",
    enableBot: true,
    shippingFee: 5000,
    freeShippingMin: 200000,
    currency: "SYP",
    darkMode: false,
    referralBonus: 5000,
    referralPercent: 5
};

const defaultCategories = [
    { id: "cat1", name: "اختبار الاختراق", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400", description: "أدوات اختبار الاختراق", order: 1 },
    { id: "cat2", name: "OSINT", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400", description: "جمع المعلومات", order: 2 },
    { id: "cat3", name: "VPN", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "حماية الشبكات", order: 3 },
    { id: "cat4", name: "منتجات رقمية", image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400", description: "دورات وكتب", order: 4 },
    { id: "cat5", name: "أجهزة", image: "https://images.unsplash.com/photo-1597225244661-8cfb5ddb0f8e?w=400", description: "أجهزة هاكينغ", order: 5 }
];

const defaultProducts = [
    { id: "p1", categoryId: "cat1", name: "Kali Linux Pro Kit", priceSYP: 450000, oldPrice: 550000, description: "نسخة مخصصة من كالي مع 200+ أداة ودورة فيديو", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400", downloadLink: "", createdAt: Date.now(), stock: 999, isDigital: true, rating: 4.9, ratingCount: 128, views: 1243, sales: 89 },
    { id: "p2", categoryId: "cat1", name: "Burp Suite Pro License", priceSYP: 1250000, oldPrice: 1500000, description: "رخصة سنة كاملة لأقوى أداة فحص ثغرات", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400", downloadLink: "", createdAt: Date.now(), stock: 25, isDigital: true, rating: 5.0, ratingCount: 45, views: 892, sales: 12 },
    { id: "p3", categoryId: "cat2", name: "حزمة OSINT Master", priceSYP: 320000, oldPrice: 0, description: "50 أداة OSINT + قوائم dorks + سكربتات", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400", downloadLink: "", createdAt: Date.now(), stock: 999, isDigital: true, rating: 4.7, ratingCount: 67, views: 756, sales: 34 },
    { id: "p4", categoryId: "cat3", name: "VPN Lifetime", priceSYP: 850000, oldPrice: 1200000, description: "اشتراك مدى الحياة - 15 دولة - WireGuard", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", downloadLink: "", createdAt: Date.now(), stock: 100, isDigital: true, rating: 4.8, ratingCount: 203, views: 2104, sales: 156 },
    { id: "p5", categoryId: "cat4", name: "دورة اختراق أخلاقي", priceSYP: 680000, oldPrice: 0, description: "35 ساعة فيديو بالعربي - شهادة معتمدة", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400", downloadLink: "", createdAt: Date.now(), stock: 999, isDigital: true, rating: 4.9, ratingCount: 312, views: 3421, sales: 278 },
    { id: "p6", categoryId: "cat5", name: "Flipper Zero", priceSYP: 2750000, oldPrice: 3200000, description: "جهاز Flipper Zero أصلي + كفر + هوائي", image: "https://images.unsplash.com/photo-1597225244661-8cfb5ddb0f8e?w=400", downloadLink: "", createdAt: Date.now(), stock: 7, isDigital: false, rating: 5.0, ratingCount: 89, views: 5432, sales: 23 }
];

// Coupons
let coupons = ls.get("idlebx:coupons", [
    { code: "WELCOME10", discount: 10, type: "percent", expires: null, uses: 0, maxUses: 100, minOrder: 100000 },
    { code: "SAVE50", discount: 50000, type: "fixed", expires: null, uses: 0, maxUses: 50, minOrder: 500000 },
    { code: "CYBER10", discount: 10, type: "percent", expires: null, uses: 0, maxUses: 999, minOrder: 0 }
]);

// Referrals
let referrals = ls.get("idlebx:referrals", {});

// ============== Main App Component ==============
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
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [adminOpen, setAdminOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(() => ls.get("idlebx:auth", false));
    const [adminTab, setAdminTab] = useState("dashboard");
    const [purchaseStatus, setPurchaseStatus] = useState(null);
    const [userId, setUserId] = useState(() => ls.get("idlebx:user_id", ""));
    const [showUserIdModal, setShowUserIdModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [darkMode, setDarkMode] = useState(() => ls.get("idlebx:darkmode", false));
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [referralLink, setReferralLink] = useState("");
    
    // Admin form states
    const [newCatName, setNewCatName] = useState("");
    const [newCatDesc, setNewCatDesc] = useState("");
    const [newCatImg, setNewCatImg] = useState("");
    const [newProdName, setNewProdName] = useState("");
    const [newProdPrice, setNewProdPrice] = useState("");
    const [newProdOldPrice, setNewProdOldPrice] = useState("");
    const [newProdDesc, setNewProdDesc] = useState("");
    const [newProdImg, setNewProdImg] = useState("");
    const [newProdCat, setNewProdCat] = useState("");
    const [newProdStock, setNewProdStock] = useState("999");
    const [newProdDigital, setNewProdDigital] = useState(true);
    const [newProdRating, setNewProdRating] = useState("4.5");
    const [newProdLink, setNewProdLink] = useState("");
    const [newCouponCode, setNewCouponCode] = useState("");
    const [newCouponDiscount, setNewCouponDiscount] = useState("");
    const [newCouponType, setNewCouponType] = useState("percent");
    const [newCouponMinOrder, setNewCouponMinOrder] = useState("0");
    
    const pwdRef = useRef(null);
    const userIdRef = useRef(null);
    const clickCount = useRef(0);
    const clickTimer = useRef(null);
    const chartRef = useRef(null);

    // Apply dark mode
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        ls.set("idlebx:darkmode", darkMode);
    }, [darkMode]);

    // Add notification
    const addNotification = (title, message, type = "info") => {
        const newNotif = { id: Date.now(), title, message, type, read: false, date: new Date() };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotif.id)), 5000);
    };

    // Save data
    useEffect(() => { ls.set("idlebx:settings", settings); }, [settings]);
    useEffect(() => { ls.set("idlebx:categories", categories); }, [categories]);
    useEffect(() => { ls.set("idlebx:products", products); }, [products]);
    useEffect(() => { ls.set("idlebx:cart", cart); }, [cart]);
    useEffect(() => { ls.set("idlebx:wishlist", wishlist); }, [wishlist]);
    useEffect(() => { ls.set("idlebx:auth", isAuth); }, [isAuth]);
    useEffect(() => { if (userId) ls.set("idlebx:user_id", userId); }, [userId]);
    useEffect(() => { ls.set("idlebx:coupons", coupons); }, []);
    useEffect(() => { ls.set("idlebx:referrals", referrals); }, []);

    // Filter products
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
        else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
        else if (sortBy === "bestseller") list.sort((a, b) => b.sales - a.sales);
        else list.sort((a, b) => b.createdAt - a.createdAt);
        return list;
    }, [products, activeCat, search, sortBy]);

    const categoriesSorted = [...categories].sort((a, b) => a.order - b.order);
    
    const cartTotal = cart.reduce((sum, item) => {
        const p = products.find(x => x.id === item.id);
        return sum + (p ? p.priceSYP * item.qty : 0);
    }, 0);
    
    // Calculate discount from coupon
    const getDiscountAmount = () => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === "percent") return (cartTotal * appliedCoupon.discount) / 100;
        return appliedCoupon.discount;
    };
    
    const discountAmount = getDiscountAmount();
    const shippingFee = cartTotal > settings.freeShippingMin ? 0 : settings.shippingFee;
    const finalTotal = cartTotal - discountAmount + shippingFee;

    // Apply coupon
    const applyCoupon = () => {
        const coupon = coupons.find(c => c.code === couponCode.toUpperCase());
        if (!coupon) {
            addNotification("خطأ", "كود الخصم غير صحيح", "error");
            return;
        }
        if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
            addNotification("خطأ", "تم استخدام هذا الكود أقصى عدد مرات", "error");
            return;
        }
        if (coupon.minOrder && cartTotal < coupon.minOrder) {
            addNotification("خطأ", `الحد الأدنى للطلب هو ${formatPrice(coupon.minOrder)}`, "error");
            return;
        }
        setAppliedCoupon(coupon);
        addNotification("تم التطبيق", `تم تطبيق كود الخصم ${coupon.code}`, "success");
    };

    // Cart functions
    const addToCart = (productId) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === productId);
            if (existing) return prev.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { id: productId, qty: 1 }];
        });
        setCartOpen(true);
        addNotification("تم الإضافة", "تم إضافة المنتج إلى السلة", "success");
    };
    
    const updateQty = (productId, qty) => {
        if (qty <= 0) setCart(prev => prev.filter(i => i.id !== productId));
        else setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
    };
    
    const toggleWishlist = (id) => {
        setWishlist(prev => {
            const newWishlist = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            addNotification("المفضلة", prev.includes(id) ? "تم إزالة المنتج من المفضلة" : "تم إضافة المنتج إلى المفضلة", "info");
            return newWishlist;
        });
    };
    
    const incrementView = (id) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, views: p.views + 1 } : p));
    };

    // Add review
    const addReview = () => {
        if (!reviewText.trim()) return;
        setProducts(prev => prev.map(p => 
            p.id === selectedProduct?.id 
                ? { 
                    ...p, 
                    rating: ((p.rating * p.ratingCount) + reviewRating) / (p.ratingCount + 1),
                    ratingCount: p.ratingCount + 1,
                    reviews: [...(p.reviews || []), { user: userId || "مستخدم", rating: reviewRating, text: reviewText, date: new Date() }]
                  }
                : p
        ));
        setShowReviewModal(false);
        setReviewText("");
        setReviewRating(5);
        addNotification("شكراً لك", "تم إضافة تقييمك بنجاح", "success");
    };

    // Purchase via Bot
    const purchaseViaBot = async (product) => {
        if (!userId) {
            setShowUserIdModal(true);
            return;
        }
        
        setPurchaseStatus({ loading: true, product: product.name });
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: userId,
                    text: `🛍️ طلب شراء جديد من الموقع!\n\n📦 المنتج: ${product.name}\n💰 السعر: ${formatPrice(product.priceSYP)}\n🔗 رابط المنتج: ${product.downloadLink || "لا يوجد رابط تلقائي"}\n\nللشراء، يرجى إرسال المبلغ إلى المحفظة التالية: [رقم المحفظة]`,
                    parse_mode: "HTML"
                })
            });
            
            const data = await response.json();
            
            if (data.ok) {
                setPurchaseStatus({ success: true, message: `✅ تم إرسال طلب شراء ${product.name} إلى البوت!` });
                addNotification("تم الإرسال", `تم إرسال طلب ${product.name} إلى البوت`, "success");
            } else {
                setPurchaseStatus({ error: true, message: "❌ فشل إرسال الطلب" });
            }
        } catch (error) {
            setPurchaseStatus({ error: true, message: `❌ خطأ: ${error.message}` });
        }
        
        setTimeout(() => setPurchaseStatus(null), 10000);
    };

    // Generate referral link
    const generateReferralLink = () => {
        const refId = userId || uid();
        if (!userId) setUserId(refId);
        const link = `${window.location.origin}?ref=${refId}`;
        setReferralLink(link);
        addNotification("رابط الدعوة", "تم إنشاء رابط الدعوة الخاص بك", "info");
    };

    // Admin functions
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
        addNotification("تم الإضافة", "تم إضافة القسم بنجاح", "success");
    };
    
    const deleteCategory = (id) => {
        if (!confirm("حذف القسم سيحذف جميع منتجاته؟")) return;
        setCategories(categories.filter(c => c.id !== id));
        setProducts(products.filter(p => p.categoryId !== id));
        if (activeCat === id) setActiveCat("all");
        addNotification("تم الحذف", "تم حذف القسم", "warning");
    };
    
    const addProduct = () => {
        if (!newProdName.trim()) return alert("أدخل اسم المنتج");
        const priceNum = parseInt(newProdPrice);
        if (isNaN(priceNum)) return alert("أدخل سعر صحيح");
        
        const newProduct = {
            id: uid(),
            name: newProdName,
            priceSYP: priceNum,
            oldPrice: parseInt(newProdOldPrice) || 0,
            description: newProdDesc || "",
            image: newProdImg || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400",
            downloadLink: newProdLink || "",
            categoryId: newProdCat || categories[0]?.id,
            createdAt: Date.now(),
            stock: parseInt(newProdStock) || 999,
            isDigital: newProdDigital,
            rating: parseFloat(newProdRating) || 4.5,
            ratingCount: 0,
            views: 0,
            sales: 0,
            reviews: []
        };
        setProducts([newProduct, ...products]);
        setNewProdName(""); setNewProdPrice(""); setNewProdOldPrice(""); setNewProdDesc(""); setNewProdImg(""); setNewProdLink("");
        setNewProdStock("999"); setNewProdDigital(true); setNewProdRating("4.5");
        addNotification("تم الإضافة", `تم إضافة المنتج ${newProdName}`, "success");
    };
    
    const deleteProduct = (id) => {
        if (!confirm("هل تريد حذف هذا المنتج؟")) return;
        const product = products.find(p => p.id === id);
        setProducts(products.filter(p => p.id !== id));
        setCart(cart.filter(i => i.id !== id));
        addNotification("تم الحذف", `تم حذف المنتج ${product?.name}`, "warning");
    };

    const addCoupon = () => {
        if (!newCouponCode.trim()) return alert("أدخل كود الخصم");
        const discount = parseInt(newCouponDiscount);
        if (isNaN(discount)) return alert("أدخل قيمة الخصم");
        
        const newCoupon = {
            code: newCouponCode.toUpperCase(),
            discount: discount,
            type: newCouponType,
            minOrder: parseInt(newCouponMinOrder) || 0,
            expires: null,
            uses: 0,
            maxUses: 999,
            createdAt: new Date()
        };
        coupons.push(newCoupon);
        ls.set("idlebx:coupons", coupons);
        setNewCouponCode(""); setNewCouponDiscount(""); setNewCouponType("percent"); setNewCouponMinOrder("0");
        addNotification("تم الإضافة", `تم إضافة كود الخصم ${newCouponCode}`, "success");
    };

    // Admin panel access
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
            addNotification("مرحباً مشرف", "تم تسجيل الدخول إلى لوحة التحكم", "success");
        } else {
            alert("كلمة مرور خاطئة");
        }
    };
    
    const logout = () => {
        setIsAuth(false);
        setAdminOpen(false);
        addNotification("تم الخروج", "تم تسجيل الخروج من لوحة التحكم", "info");
    };
    
    const saveUserId = () => {
        const id = userIdRef.current?.value || "";
        if (id) {
            setUserId(id);
            setShowUserIdModal(false);
            generateReferralLink();
            addNotification("تم الحفظ", "تم حفظ معرف التليجرام", "success");
        } else {
            alert("الرجاء إدخال معرف التليجرام الخاص بك");
        }
    };

    // Export data
    const exportData = () => {
        const data = {
            products, categories, settings, coupons, users: { cart, wishlist }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `idlebx-backup-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addNotification("تم التصدير", "تم تصدير البيانات بنجاح", "success");
    };

    // Import data
    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.products) setProducts(data.products);
                if (data.categories) setCategories(data.categories);
                if (data.settings) setSettings(data.settings);
                if (data.coupons) ls.set("idlebx:coupons", data.coupons);
                addNotification("تم الاستيراد", "تم استيراد البيانات بنجاح", "success");
            } catch (err) {
                alert("خطأ في قراءة الملف");
            }
        };
        reader.readAsText(file);
    };

    // Get top products
    const topProducts = useMemo(() => {
        return [...products].sort((a, b) => b.sales - a.sales).slice(0, 5);
    }, [products]);

    // WhatsApp links
    const getWhatsAppLink = (product) => {
        const cat = categories.find(c => c.id === product.categoryId);
        const msg = `مرحباً ${settings.shopName} 👋\n\nأرغب بشراء المنتج التالي:\n\n📦 *${product.name}*\n🏷️ القسم: ${cat?.name || ''}\n💰 السعر: ${formatPrice(product.priceSYP)}\n${product.isDigital ? '⚡ تسليم فوري رقمي' : '📦 منتج فيزيائي'}\n⭐ التقييم: ${product.rating}/5\n\n📝 الوصف:\n${product.description}\n\nالرجاء تزويدي بطريقة الدفع والاستلام.`;
        return `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    };

    const getCartWhatsAppLink = () => {
        const items = cart.map(item => {
            const p = products.find(x => x.id === item.id);
            return `• ${p.name} ×${item.qty} = ${formatPrice(p.priceSYP * item.qty)}`;
        }).join('\n');
        const msg = `مرحباً ${settings.shopName} 👋\n\nأرغب بطلب المنتجات التالية:\n\n${items}\n\n💰 المجموع: ${formatPrice(cartTotal)}\n${appliedCoupon ? `🎉 خصم ${appliedCoupon.code}: -${formatPrice(discountAmount)}\n` : ''}🚚 الشحن: ${shippingFee === 0 ? 'مجاني' : formatPrice(shippingFee)}\n💵 المبلغ النهائي: ${formatPrice(finalTotal)}\n\nعدد المنتجات: ${cart.reduce((s, i) => s + i.qty, 0)}\n\nالرجاء تأكيد الطلب وطريقة الدفع.`;
        return `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    };

    // Calculate stats
    const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
    const totalRevenue = products.reduce((sum, p) => sum + (p.priceSYP * p.sales), 0);
    const totalViews = products.reduce((sum, p) => sum + p.views, 0);
    const outOfStock = products.filter(p => p.stock === 0).length;

    // JSX
    return (
        <div>
            {/* User ID Modal */}
            {showUserIdModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="admin-header">
                            <h3>🤖 تفعيل الشراء عبر البوت</h3>
                            <button className="login-btn" onClick={() => setShowUserIdModal(false)}>✕</button>
                        </div>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ marginBottom: '20px' }}>للشراء عبر بوت التليجرام، الرجاء إدخال معرفك:</p>
                            <input type="text" ref={userIdRef} className="search-input" placeholder="مثال: @username أو 123456789" style={{ width: '100%', marginBottom: '20px' }} />
                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>💡 يمكنك الحصول على معرفك من @userinfobot في التليجرام</p>
                            <button className="btn-primary" onClick={saveUserId}>تأكيد</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && selectedProduct && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="admin-header">
                            <h3>⭐ تقييم المنتج: {selectedProduct.name}</h3>
                            <button className="login-btn" onClick={() => setShowReviewModal(false)}>✕</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className={`star ${reviewRating >= star ? 'active' : ''}`} onClick={() => setReviewRating(star)}>★</span>
                                ))}
                            </div>
                            <textarea className="search-input" style={{ width: '100%', height: '100px', marginBottom: '15px' }} placeholder="اكتب تقييمك هنا..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                            <button className="btn-primary" style={{ width: '100%' }} onClick={addReview}>إرسال التقييم</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Status Modal */}
            {purchaseStatus && (
                <div className="modal">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="admin-header">
                            <h3>{purchaseStatus.success ? '✅ تم الإرسال' : (purchaseStatus.error ? '❌ فشل' : '⏳ جاري المعالجة')}</h3>
                            <button className="login-btn" onClick={() => setPurchaseStatus(null)}>✕</button>
                        </div>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ whiteSpace: 'pre-line' }}>{purchaseStatus.message}</p>
                            {purchaseStatus.loading && <div className="loading-spinner" style={{ marginTop: '20px' }}></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Panel */}
            {showNotifications && (
                <div style={{ position: 'fixed', top: '80px', right: '20px', width: '320px', maxHeight: '400px', overflow: 'auto', background: 'var(--dark-card)', border: '1px solid var(--primary)', borderRadius: '16px', zIndex: 1000, padding: '10px' }}>
                    <div className="admin-header" style={{ marginBottom: '10px' }}>
                        <h4 style={{ margin: 0 }}>📢 الإشعارات</h4>
                        <button className="login-btn" onClick={() => setShowNotifications(false)}>✕</button>
                    </div>
                    {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>لا توجد إشعارات</p>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} style={{ padding: '10px', borderBottom: '1px solid var(--dark-border)', marginBottom: '5px' }}>
                                <strong>{n.title}</strong>
                                <p style={{ fontSize: '12px', marginTop: '5px' }}>{n.message}</p>
                                <small style={{ color: 'var(--text-dim)' }}>{new Date(n.date).toLocaleTimeString()}</small>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo" onClick={logoSecret}>
                            <div className="logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                            </div>
                            <div>
                                <div className="logo-text"><span>IDLEB</span><span>X</span></div>
                                <div className="logo-badge">CYBER ARSENAL</div>
                            </div>
                        </div>
                        
                        <div className={`search-area ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                            <input type="text" className="search-input" placeholder="ابحث في المنتجات..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="new">الأحدث</option>
                                <option value="popular">الأكثر مشاهدة</option>
                                <option value="bestseller">الأكثر مبيعاً</option>
                                <option value="rating">الأعلى تقييماً</option>
                                <option value="price-asc">السعر: منخفض</option>
                                <option value="price-desc">السعر: مرتفع</option>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "الوضع الفاتح" : "الوضع المظلم"}>
                                {darkMode ? '☀️' : '🌙'}
                            </button>
                            <button className="cart-button" onClick={() => setCartOpen(true)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M6 6h15l-1.5 8.5H7.5L6 6zM9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                                </svg>
                                {cart.length > 0 && <span className="cart-count">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
                            </button>
                            <button className="menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="container">
                <div className="hero">
                    <h1>ترسانة الهاكر الأخلاقي <span>بين يديك</span></h1>
                    <p>أدوات اختبار اختراق، دورات احترافية، أجهزة هاكينغ، وحلول VPN مشفرة</p>
                    <a href="#products" className="btn-primary">تصفح الأدوات</a>
                </div>

                {/* Stats Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', background: 'var(--dark-card)', padding: '15px', borderRadius: '16px' }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{products.length}</div><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>منتج</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{totalSales}</div><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>مبيع</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatPrice(totalRevenue)}</div><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>إيرادات</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{totalViews}</div><div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>مشاهدة</div></div>
                </div>

                {/* Categories */}
                <h2 className="section-title">الأقسام <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{categories.length} أقسام</span></h2>
                <div className="categories-grid">
                    <div className={`category-card ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')}>
                        <div className="category-card-content"><h3>✨ الكل</h3><p>جميع المنتجات</p></div>
                    </div>
                    {categoriesSorted.map(cat => (
                        <div key={cat.id} className={`category-card ${activeCat === cat.id ? 'active' : ''}`} onClick={() => setActiveCat(cat.id)}>
                            <img src={cat.image} alt={cat.name} />
                            <div className="category-card-content"><h3>{cat.name}</h3><p>{cat.description}</p></div>
                        </div>
                    ))}
                </div>

                {/* Top Products */}
                <h2 className="section-title">🏆 الأكثر مبيعاً</h2>
                <div className="products-grid">
                    {topProducts.map(product => {
                        const inWishlist = wishlist.includes(product.id);
                        const cat = categories.find(c => c.id === product.categoryId);
                        return (
                            <div key={product.id} className="product-card">
                                <div className="product-image">
                                    <img src={product.image} alt={product.name} />
                                    <div className="product-badges">
                                        {product.isDigital && <span className="badge-digital">رقمي</span>}
                                        {product.stock < 10 && !product.isDigital && <span className="badge-stock">باقي {product.stock}</span>}
                                        {product.oldPrice > 0 && <span className="badge-sale">-{Math.round((1 - product.priceSYP / product.oldPrice) * 100)}%</span>}
                                    </div>
                                    <button className={`wishlist-btn ${inWishlist ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)}>
                                        {inWishlist ? '❤️' : '🤍'}
                                    </button>
                                    <div className="product-stats">
                                        <span className="stat">⭐ {product.rating}</span>
                                        <span className="stat">👁 {product.views}</span>
                                        <span className="stat">🛒 {product.sales}</span>
                                    </div>
                                </div>
                                <div className="product-info">
                                    <div className="product-title">{product.name}</div>
                                    <div className="product-desc">{product.description}</div>
                                    <div className="product-category">{cat?.name}</div>
                                    <div className="product-price">
                                        {formatPrice(product.priceSYP)}
                                        {product.oldPrice > 0 && <span className="product-old-price">{formatPrice(product.oldPrice)}</span>}
                                    </div>
                                    <div className="product-actions">
                                        {settings.enableBot && settings.botToken && product.isDigital ? (
                                            <button className="btn-buy" onClick={() => purchaseViaBot(product)}>🤖 شراء عبر البوت</button>
                                        ) : (
                                            <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="btn-buy" onClick={() => incrementView(product.id)}>📞 طلب عبر واتساب</a>
                                        )}
                                        <button className="btn-cart" onClick={() => addToCart(product.id)}>🛒</button>
                                        <button className="btn-cart" onClick={() => { setSelectedProduct(product); setShowReviewModal(true); }}>⭐</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* All Products */}
                <h2 className="section-title" id="products">
                    {activeCat === 'all' ? 'جميع المنتجات' : categories.find(c => c.id === activeCat)?.name}
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{filteredProducts.length} منتج</span>
                </h2>
                
                {filteredProducts.length === 0 ? (
                    <div className="empty-state"><p>لا توجد منتجات مطابقة للبحث</p></div>
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
                                            {product.oldPrice > 0 && <span className="badge-sale">-{Math.round((1 - product.priceSYP / product.oldPrice) * 100)}%</span>}
                                        </div>
                                        <button className={`wishlist-btn ${inWishlist ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)}>
                                            {inWishlist ? '❤️' : '🤍'}
                                        </button>
                                        <div className="product-stats">
                                            <span className="stat">⭐ {product.rating}</span>
                                            <span className="stat">👁 {product.views}</span>
                                            <span className="stat">🛒 {product.sales}</span>
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <div className="product-title">{product.name}</div>
                                        <div className="product-desc">{product.description}</div>
                                        <div className="product-category">{cat?.name}</div>
                                        <div className="product-price">
                                            {formatPrice(product.priceSYP)}
                                            {product.oldPrice > 0 && <span className="product-old-price">{formatPrice(product.oldPrice)}</span>}
                                        </div>
                                        <div className="product-actions">
                                            {settings.enableBot && settings.botToken && product.isDigital ? (
                                                <button className="btn-buy" onClick={() => purchaseViaBot(product)}>🤖 شراء عبر البوت</button>
                                            ) : (
                                                <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="btn-buy" onClick={() => incrementView(product.id)}>📞 طلب عبر واتساب</a>
                                            )}
                                            <button className="btn-cart" onClick={() => addToCart(product.id)}>🛒</button>
                                            <button className="btn-cart" onClick={() => { setSelectedProduct(product); setShowReviewModal(true); }}>⭐</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)}></div>
            <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>🛒 سلة التسوق</h3>
                    <button className="close-cart" onClick={() => setCartOpen(false)}>✕</button>
                </div>
                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="empty-state"><p>السلة فارغة</p></div>
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
                                <input type="text" placeholder="كود الخصم" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                                <button onClick={applyCoupon}>تطبيق</button>
                            </div>
                            {appliedCoupon && <div className="discount-message">✓ تم تطبيق خصم {appliedCoupon.type === "percent" ? `${appliedCoupon.discount}%` : formatPrice(appliedCoupon.discount)}</div>}
                        </div>
                        <div className="cart-total">
                            <div className="total-row"><span>المجموع</span><span>{formatPrice(cartTotal)}</span></div>
                            {appliedCoupon && <div className="total-row"><span>الخصم</span><span>-{formatPrice(discountAmount)}</span></div>}
                            <div className="total-row"><span>الشحن</span><span>{shippingFee === 0 ? 'مجاني' : formatPrice(shippingFee)}</span></div>
                            <div className="total-row grand-total"><span>الإجمالي</span><span>{formatPrice(finalTotal)}</span></div>
                        </div>
                        <a href={getCartWhatsAppLink()} target="_blank" className="whatsapp-checkout">📱 إتمام الطلب عبر واتساب</a>
                        <button className="clear-cart" onClick={() => setCart([])}>تفريغ السلة</button>
                    </div>
                )}
            </div>

            {/* Admin Panel */}
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
                                    <button className={`admin-tab ${adminTab === 'dashboard' ? 'active' : ''}`} onClick={() => setAdminTab('dashboard')}>📊 لوحة القيادة</button>
                                    <button className={`admin-tab ${adminTab === 'products' ? 'active' : ''}`} onClick={() => setAdminTab('products')}>📦 المنتجات</button>
                                    <button className={`admin-tab ${adminTab === 'categories' ? 'active' : ''}`} onClick={() => setAdminTab('categories')}>📁 الأقسام</button>
                                    <button className={`admin-tab ${adminTab === 'coupons' ? 'active' : ''}`} onClick={() => setAdminTab('coupons')}>🏷️ كوبونات</button>
                                    <button className={`admin-tab ${adminTab === 'settings' ? 'active' : ''}`} onClick={() => setAdminTab('settings')}>⚙️ الإعدادات</button>
                                    <button className={`admin-tab ${adminTab === 'backup' ? 'active' : ''}`} onClick={() => setAdminTab('backup')}>💾 نسخ احتياطي</button>
                                </div>

                                {/* Dashboard Tab */}
                                {adminTab === 'dashboard' && (
                                    <div>
                                        <div className="admin-stats">
                                            <div className="stat-card"><h3>{products.length}</h3><p>منتج</p></div>
                                            <div className="stat-card"><h3>{totalSales}</h3><p>مبيع</p></div>
                                            <div className="stat-card"><h3>{formatPrice(totalRevenue)}</h3><p>إيرادات</p></div>
                                            <div className="stat-card"><h3>{totalViews}</h3><p>مشاهدة</p></div>
                                            <div className="stat-card"><h3>{outOfStock}</h3><p>نفد من المخزون</p></div>
                                            <div className="stat-card"><h3>{coupons.length}</h3><p>كوبون</p></div>
                                        </div>
                                        <div className="info-box">
                                            <strong>📈 أفضل 5 منتجات مبيعاً:</strong><br/>
                                            {topProducts.map((p, i) => (
                                                <div key={p.id} style={{ marginTop: '8px' }}>{i+1}. {p.name} - {p.sales} مبيعات</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Products Tab */}
                                {adminTab === 'products' && (
                                    <>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>➕ إضافة منتج جديد</h4>
                                            <div className="form-row">
                                                <div className="form-group"><label>اسم المنتج</label><input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} /></div>
                                                <div className="form-group"><label>السعر (ل.س)</label><input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} /></div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group"><label>السعر القديم (ل.س)</label><input type="number" value={newProdOldPrice} onChange={(e) => setNewProdOldPrice(e.target.value)} /></div>
                                                <div className="form-group"><label>القسم</label>
                                                    <select value={newProdCat} onChange={(e) => setNewProdCat(e.target.value)}>
                                                        <option value="">اختر القسم</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group"><label>المخزون</label><input type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} /></div>
                                                <div className="form-group"><label>التقييم</label><input type="number" step="0.1" value={newProdRating} onChange={(e) => setNewProdRating(e.target.value)} /></div>
                                            </div>
                                            <div className="form-group"><label>رابط الصورة</label><input type="text" value={newProdImg} onChange={(e) => setNewProdImg(e.target.value)} placeholder="https://..." /></div>
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
                                                            <p>{cat?.name} • {formatPrice(p.priceSYP)} • {p.isDigital ? 'رقمي' : 'فيزيائي'} • مخزون: {p.stock} • مبيعات: {p.sales}</p>
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
                                
                                {/* Categories Tab */}
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
                                                    <div className="list-item-info"><h4>{c.name}</h4><p>{c.description}</p></div>
                                                    <div className="list-item-actions"><button className="delete-btn" onClick={() => deleteCategory(c.id)}>حذف</button></div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Coupons Tab */}
                                {adminTab === 'coupons' && (
                                    <>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>🏷️ إضافة كوبون جديد</h4>
                                            <div className="form-row">
                                                <div className="form-group"><label>كود الخصم</label><input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="SALE10" /></div>
                                                <div className="form-group"><label>قيمة الخصم</label><input type="number" value={newCouponDiscount} onChange={(e) => setNewCouponDiscount(e.target.value)} placeholder="10" /></div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group"><label>نوع الخصم</label>
                                                    <select value={newCouponType} onChange={(e) => setNewCouponType(e.target.value)}>
                                                        <option value="percent">نسبة مئوية (%)</option>
                                                        <option value="fixed">قيمة ثابتة (ل.س)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group"><label>الحد الأدنى للطلب</label><input type="number" value={newCouponMinOrder} onChange={(e) => setNewCouponMinOrder(e.target.value)} placeholder="0" /></div>
                                            </div>
                                            <button className="btn-submit" onClick={addCoupon}>إضافة الكوبون</button>
                                        </div>
                                        
                                        <div className="items-list">
                                            <h4 style={{ marginBottom: '15px' }}>🏷️ الكوبونات الحالية ({coupons.length})</h4>
                                            {coupons.map(c => (
                                                <div key={c.code} className="list-item">
                                                    <div className="list-item-info"><h4>{c.code}</h4><p>{c.type === "percent" ? `${c.discount}%` : formatPrice(c.discount)} • استخدم: {c.uses}/{c.maxUses}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                
                                {/* Settings Tab */}
                                {adminTab === 'settings' && (
                                    <div>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>⚙️ إعدادات المتجر</h4>
                                            <div className="form-group"><label>رقم الواتساب</label><input type="text" value={settings.whatsappNumber} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} /></div>
                                            <div className="form-group"><label>كود الخصم العام</label><input type="text" value={settings.discountCode} onChange={(e) => setSettings({ ...settings, discountCode: e.target.value.toUpperCase() })} /></div>
                                            <div className="form-group"><label>نسبة الخصم العام (%)</label><input type="number" value={settings.discountPercent} onChange={(e) => setSettings({ ...settings, discountPercent: Math.min(90, Math.max(0, parseInt(e.target.value) || 0)) })} /></div>
                                            <div className="form-group"><label>رسوم الشحن (ل.س)</label><input type="number" value={settings.shippingFee} onChange={(e) => setSettings({ ...settings, shippingFee: parseInt(e.target.value) || 0 })} /></div>
                                            <div className="form-group"><label>الحد الأدنى للشحن المجاني (ل.س)</label><input type="number" value={settings.freeShippingMin} onChange={(e) => setSettings({ ...settings, freeShippingMin: parseInt(e.target.value) || 0 })} /></div>
                                            <div className="form-group"><label>كلمة مرور الإدارة</label><input type="text" value={settings.adminPwd} onChange={(e) => setSettings({ ...settings, adminPwd: e.target.value })} /></div>
                                            <div className="form-group"><label>توكن البوت</label><input type="text" value={settings.botToken} onChange={(e) => setSettings({ ...settings, botToken: e.target.value })} placeholder="1234567890:ABCdefGHIjkl..." /></div>
                                            <div className="form-group"><label><input type="checkbox" checked={settings.enableBot} onChange={(e) => setSettings({ ...settings, enableBot: e.target.checked })} /> تفعيل البوت</label></div>
                                        </div>
                                        <div className="info-box">
                                            <strong>🔑 كيفية الدخول للوحة التحكم:</strong><br/>
                                            • اضغط 5 مرات بسرعة على شعار IDLEB X<br/>
                                            • أو اضغط Alt + Shift + A<br/>
                                            • كلمة المرور: {settings.adminPwd}
                                        </div>
                                    </div>
                                )}

                                {/* Backup Tab */}
                                {adminTab === 'backup' && (
                                    <div>
                                        <div className="admin-form">
                                            <h4 style={{ marginBottom: '15px' }}>💾 نسخ احتياطي واستعادة</h4>
                                            <button className="btn-submit" style={{ width: '100%', marginBottom: '15px' }} onClick={exportData}>📥 تصدير البيانات (JSON)</button>
                                            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} id="importFile" />
                                            <button className="btn-submit" style={{ width: '100%', background: 'var(--info)' }} onClick={() => document.getElementById('importFile').click()}>📤 استيراد البيانات</button>
                                        </div>
                                        <div className="info-box">
                                            <strong>💡 ملاحظة:</strong><br/>
                                            • التصدير يحفظ جميع المنتجات والأقسام والإعدادات<br/>
                                            • يمكنك استيراد البيانات لاستعادة نسخة احتياطية سابقة<br/>
                                            • البيانات تحفظ في ملف JSON
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>IDLEB X - متجر متخصص في أدوات السايبر سكيورتي والاختراق الأخلاقي</p>
                    <p style={{ marginTop: '10px' }}>جميع المنتجات للاستخدام التعليمي والقانوني فقط © {new Date().getFullYear()}</p>
                </div>
            </footer>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
