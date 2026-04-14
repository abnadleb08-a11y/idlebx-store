const { Telegraf } = require('telegraf');
const fs = require('fs');

// ============== إعدادات البوت ==============
const BOT_TOKEN = '8727549999:AAEPGB7tvc7HYf2OViD34HanwJBSc3jkOEU'; // ضع توكن البوت هنا
const bot = new Telegraf(BOT_TOKEN);
const ADMIN_ID = 7240148750; // ضع معرفك انت (مشرف)

// ============== ملفات التخزين ==============
const PRODUCTS_FILE = 'products.json';
const USERS_FILE = 'users.json';

// تحميل المنتجات
let products = [];
if (fs.existsSync(PRODUCTS_FILE)) {
    products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
} else {
    // المنتجات الافتراضية
    products = [
        {
            id: 1,
            name: "Kali Linux Pro Kit",
            price: 450000,
            link: "https://t.me/your_channel/kali_pro_kit",
            description: "نسخة مخصصة من كالي مع 200+ أداة",
            category: "اختبار الاختراق",
            stock: 999
        },
        {
            id: 2,
            name: "Burp Suite Pro License",
            price: 1250000,
            link: "https://t.me/your_channel/burp_pro",
            description: "رخصة سنة كاملة لأقوى أداة فحص ثغرات",
            category: "اختبار الاختراق",
            stock: 25
        },
        {
            id: 3,
            name: "حزمة OSINT Master",
            price: 320000,
            link: "https://t.me/your_channel/osint_master",
            description: "50 أداة OSINT + قوائم dorks",
            category: "OSINT",
            stock: 999
        },
        {
            id: 4,
            name: "VPN Lifetime",
            price: 850000,
            link: "https://t.me/your_channel/vpn_lifetime",
            description: "اشتراك مدى الحياة - 15 دولة",
            category: "VPN",
            stock: 100
        },
        {
            id: 5,
            name: "دورة اختراق أخلاقي كاملة",
            price: 680000,
            link: "https://t.me/your_channel/hacking_course",
            description: "35 ساعة فيديو بالعربي",
            category: "منتجات رقمية",
            stock: 999
        },
        {
            id: 6,
            name: "Flipper Zero",
            price: 2750000,
            link: "",
            description: "جهاز Flipper Zero أصلي",
            category: "أجهزة",
            stock: 7
        }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// تحميل بيانات المستخدمين
let users = {};
if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
}

// ============== دوال مساعدة ==============
function saveProducts() {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function formatPrice(price) {
    return price.toLocaleString('ar-SY') + " ل.س";
}

// ============== أوامر البوت ==============

// أمر بدء البوت
bot.start((ctx) => {
    const userId = ctx.from.id;
    if (!users[userId]) {
        users[userId] = { balance: 0, purchases: [] };
        saveUsers();
    }
    ctx.reply(`
🎉 *مرحباً بك في متجر IDLEB X للبوت!*

🔹 /products - عرض جميع المنتجات
🔹 /product <رقم> - عرض تفاصيل منتج معين
🔹 /buy <رقم> - شراء منتج
🔹 /balance - عرض رصيدك
🔹 /charge <مبلغ> - شحن الرصيد (للمشرف)

📦 *جميع المنتجات الرقمية يتم تسليمها فوراً بعد الشراء*
    `, { parse_mode: 'Markdown' });
});

// عرض جميع المنتجات
bot.command('products', (ctx) => {
    let message = "📦 *قائمة المنتجات:*\n\n";
    
    products.forEach(p => {
        message += `*${p.id}.* ${p.name}\n`;
        message += `   💰 السعر: ${formatPrice(p.price)}\n`;
        message += `   📂 القسم: ${p.category}\n`;
        message += `   📝 ${p.description.substring(0, 40)}...\n\n`;
    });
    
    message += "\nللشراء: /buy <رقم_المنتج>\nلعرض تفاصيل المنتج: /product <رقم>";
    
    ctx.reply(message, { parse_mode: 'Markdown' });
});

// عرض تفاصيل منتج محدد
bot.command('product', (ctx) => {
    const args = ctx.message.text.split(' ');
    const productId = parseInt(args[1]);
    
    if (isNaN(productId)) {
        return ctx.reply("⚠️ الرجاء إدخال رقم المنتج: /product 1");
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        return ctx.reply("❌ لا يوجد منتج بهذا الرقم");
    }
    
    let message = `📦 *${product.name}*\n\n`;
    message += `💰 السعر: ${formatPrice(product.price)}\n`;
    message += `📂 القسم: ${product.category}\n`;
    message += `📝 الوصف: ${product.description}\n`;
    message += `📊 المخزون: ${product.stock > 0 ? product.stock : "غير متوفر"}\n\n`;
    
    if (product.link) {
        message += `🔗 رابط التحميل: ${product.link}\n\n`;
    }
    
    message += `🛒 للشراء: /buy ${product.id}`;
    
    ctx.reply(message, { parse_mode: 'Markdown' });
});

// شراء منتج
bot.command('buy', async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const productId = parseInt(args[1]);
    
    if (isNaN(productId)) {
        return ctx.reply("⚠️ الرجاء إدخال رقم المنتج: /buy 1");
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        return ctx.reply("❌ لا يوجد منتج بهذا الرقم");
    }
    
    if (product.stock <= 0 && product.link) {
        return ctx.reply("❌ عذراً، هذا المنتج غير متوفر حالياً");
    }
    
    if (!users[userId]) {
        users[userId] = { balance: 0, purchases: [] };
        saveUsers();
    }
    
    if (users[userId].balance < product.price) {
        const needed = product.price - users[userId].balance;
        return ctx.reply(`❌ *رصيدك غير كافٍ!*\n\n💰 رصيدك: ${formatPrice(users[userId].balance)}\n💵 سعر المنتج: ${formatPrice(product.price)}\n💸 المبلغ الناقص: ${formatPrice(needed)}\n\nلشحن الرصيد: /charge ${needed}`, { parse_mode: 'Markdown' });
    }
    
    // خصم الرصيد
    users[userId].balance -= product.price;
    users[userId].purchases.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        date: new Date().toISOString(),
        link: product.link
    });
    
    // تقليل المخزون
    if (product.link) {
        product.stock--;
        saveProducts();
    }
    
    saveUsers();
    
    // إرسال رابط التحميل
    let replyMessage = `✅ *تم شراء ${product.name} بنجاح!*\n\n`;
    replyMessage += `💰 الرصيد المتبقي: ${formatPrice(users[userId].balance)}\n`;
    
    if (product.link) {
        replyMessage += `\n📥 *رابط التحميل:*\n${product.link}\n\n`;
        replyMessage += `⚠️ هذا الرابط خاص بك، يرجى عدم مشاركته مع الآخرين.`;
    } else {
        replyMessage += `\n📦 هذا المنتج فيزيائي، سيتم التواصل معك لتوصيل الطلب خلال 24 ساعة.`;
    }
    
    ctx.reply(replyMessage, { parse_mode: 'Markdown' });
});

// عرض الرصيد
bot.command('balance', (ctx) => {
    const userId = ctx.from.id;
    const balance = users[userId]?.balance || 0;
    ctx.reply(`💰 *رصيدك الحالي:* ${formatPrice(balance)}`, { parse_mode: 'Markdown' });
});

// شحن الرصيد (للمشرف فقط)
bot.command('charge', (ctx) => {
    const userId = ctx.from.id;
    
    if (userId !== ADMIN_ID) {
        return ctx.reply("⛔ هذا الأمر للمشرف فقط");
    }
    
    const args = ctx.message.text.split(' ');
    const targetUser = parseInt(args[1]);
    const amount = parseInt(args[2]);
    
    if (isNaN(targetUser) || isNaN(amount)) {
        return ctx.reply("⚠️ طريقة الاستخدام: /charge <معرف_المستخدم> <المبلغ>\nمثال: /charge 123456789 50000");
    }
    
    if (!users[targetUser]) {
        users[targetUser] = { balance: 0, purchases: [] };
    }
    
    users[targetUser].balance += amount;
    saveUsers();
    
    ctx.reply(`✅ تم شحن رصيد المستخدم ${targetUser} بمبلغ ${formatPrice(amount)}`);
    
    // إشعار المستخدم
    bot.telegram.sendMessage(targetUser, `🎉 تم شحن رصيدك بمبلغ ${formatPrice(amount)}\n💰 رصيدك الحالي: ${formatPrice(users[targetUser].balance)}`);
});

// ============== أوامر إدارة المنتجات (للمشرف فقط) ==============

// إضافة منتج جديد
bot.command('addproduct', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) return ctx.reply("⛔ هذا الأمر للمشرف فقط");
    
    ctx.reply(`
📝 *إضافة منتج جديد*

الرجاء إرسال معلومات المنتج بهذا التنسيق:

\`\`\`
الاسم: [اسم المنتج]
السعر: [السعر]
الرابط: [رابط التحميل]
القسم: [القسم]
الوصف: [وصف المنتج]
المخزون: [الكمية]
\`\`\`

مثال:
\`\`\`
الاسم: Kali Linux Pro Kit
السعر: 450000
الرابط: https://t.me/your_channel/file
القسم: اختبار الاختراق
الوصف: نسخة كاملة من كالي مع 200 أداة
المخزون: 999
\`\`\`
    `, { parse_mode: 'Markdown' });
    
    // انتظار رد المستخدم
    bot.on('text', async (ctx, next) => {
        if (ctx.message.text.startsWith('الاسم:')) {
            const text = ctx.message.text;
            const name = text.match(/الاسم: (.*)/)?.[1];
            const price = parseInt(text.match(/السعر: (.*)/)?.[1]);
            const link = text.match(/الرابط: (.*)/)?.[1];
            const category = text.match(/القسم: (.*)/)?.[1];
            const description = text.match(/الوصف: (.*)/)?.[1];
            const stock = parseInt(text.match(/المخزون: (.*)/)?.[1]);
            
            if (!name || !price || !link) {
                return ctx.reply("❌ المعلومات غير مكتملة. الاسم، السعر، والرابط مطلوبة.");
            }
            
            const newId = products.length + 1;
            const newProduct = {
                id: newId,
                name: name,
                price: price,
                link: link,
                category: category || "عام",
                description: description || "",
                stock: stock || 999
            };
            
            products.push(newProduct);
            saveProducts();
            
            ctx.reply(`✅ تم إضافة المنتج بنجاح!\n\n📦 ${name}\n💰 ${formatPrice(price)}\n🔗 ${link}\n\nالمنتج متوفر الآن للبيع برقم ${newId}`);
        }
        next();
    });
});

// حذف منتج
bot.command('deleteproduct', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) return ctx.reply("⛔ هذا الأمر للمشرف فقط");
    
    const args = ctx.message.text.split(' ');
    const productId = parseInt(args[1]);
    
    if (isNaN(productId)) {
        return ctx.reply("⚠️ طريقة الاستخدام: /deleteproduct <رقم_المنتج>");
    }
    
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) {
        return ctx.reply("❌ لا يوجد منتج بهذا الرقم");
    }
    
    const deleted = products[index];
    products.splice(index, 1);
    saveProducts();
    
    ctx.reply(`✅ تم حذف المنتج:\n📦 ${deleted.name}`);
});

// تحديث رابط منتج
bot.command('updatelink', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) return ctx.reply("⛔ هذا الأمر للمشرف فقط");
    
    const args = ctx.message.text.split(' ');
    const productId = parseInt(args[1]);
    const newLink = args[2];
    
    if (isNaN(productId) || !newLink) {
        return ctx.reply("⚠️ طريقة الاستخدام: /updatelink <رقم_المنتج> <الرابط الجديد>");
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        return ctx.reply("❌ لا يوجد منتج بهذا الرقم");
    }
    
    product.link = newLink;
    saveProducts();
    
    ctx.reply(`✅ تم تحديث رابط المنتج:\n📦 ${product.name}\n🔗 ${newLink}`);
});

// عرض جميع المنتجات مع روابطها (للمشرف)
bot.command('alllinks', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) return ctx.reply("⛔ هذا الأمر للمشرف فقط");
    
    let message = "🔗 *جميع روابط المنتجات:*\n\n";
    products.forEach(p => {
        message += `*${p.id}. ${p.name}*\n`;
        message += `   🔗 ${p.link || "لا يوجد رابط"}\n\n`;
    });
    
    ctx.reply(message, { parse_mode: 'Markdown' });
});

// إحصائيات البوت
bot.command('stats', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) return ctx.reply("⛔ هذا الأمر للمشرف فقط");
    
    const totalUsers = Object.keys(users).length;
    const totalSales = users.reduce((sum, u) => sum + u.purchases.length, 0);
    const totalRevenue = users.reduce((sum, u) => {
        return sum + u.purchases.reduce((s, p) => s + p.price, 0);
    }, 0);
    
    ctx.reply(`
📊 *إحصائيات البوت*

👥 عدد المستخدمين: ${totalUsers}
🛒 عدد المبيعات: ${totalSales}
💰 إجمالي الإيرادات: ${formatPrice(totalRevenue)}
📦 عدد المنتجات: ${products.length}
    `, { parse_mode: 'Markdown' });
});

// ============== تشغيل البوت ==============
bot.launch();
console.log('🤖 البوت يعمل...');
console.log('📦 عدد المنتجات المحملة:', products.length);
products.forEach(p => {
    console.log(`   - ${p.id}. ${p.name} -> ${p.link || "لا يوجد رابط"}`);
});

// إيقاف آمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
