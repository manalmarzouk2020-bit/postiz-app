# نشر Postiz + AI Sales Brain على سيرفر حقيقي

هذا الدليل يوصلك من الكود على GitHub لنسخة شغالة live على دومين حقيقي، بأقل عدد
خطوات ممكن. كل الملفات (Docker, GitHub Action, docker-compose) جاهزة بالفعل في
الريبو - الخطوات اللي تحتها هي فقط اللي محتاجة حساباتك الشخصية (دفع، دومين،
سيرفر) واللي محدّش غيرك يقدر يعملها.

## الفكرة باختصار

- كل مرة تعملي push للفرع، GitHub بيبني صورة Docker فيها التطبيق كامل (فرونت
  إند + باك إند + Sales Brain) ويرفعها تلقائيًا لحساب GitHub بتاعك (مجاني،
  مفيش خطوة إضافية منك).
- سيرفر واحد (VPS) بيشغل الصورة دي + قاعدة البيانات + Redis + Temporal، وCaddy
  بيوفر HTTPS تلقائي على الدومين بتاعك.
- **GoHighLevel**: مش جزء من الاستضافة. لو حبيتي لاحقًا تربطي عميل شغال بيه،
  ده تكامل webhook منفصل نضيفه وقتها.
- **Vercel**: مش محتاجينه في المسار ده - Caddy + السيرفر بيقدموا الفرونت إند
  والباك إند مع بعض على نفس الدومين، وده أبسط وأرخص من تقسيمهم على منصتين.

---

## الخطوة 1 - فعّلي صلاحية الكتابة لـ GitHub Actions (مرة واحدة بس)

1. افتحي الريبو على GitHub → **Settings** → **Actions** → **General**.
2. تحت **Workflow permissions** اختاري **Read and write permissions**.
3. احفظي.

من غير الخطوة دي، الـ Action مش هيقدر يرفع الصورة لـ GitHub Container Registry.

بعدها، أي `git push` على الفرع `claude/ai-sales-brain-saas-mqw8qo` (أو `main`)
هيبني وينشر الصورة تلقائيًا على:

```
ghcr.io/<اسم حسابك على GitHub>/postiz-salesbrain:latest
```

تقدري تتابعي التقدم من تبويب **Actions** في الريبو.

## الخطوة 2 - خليكي الصورة قابلة للسحب من السيرفر

أبسط طريقة: خليها **Public**.

1. من صفحة حسابك على GitHub → **Packages** → افتحي `postiz-salesbrain`.
2. **Package settings** → **Change visibility** → **Public**.

(لو فضلتيها Private، السيرفر هيحتاج `docker login ghcr.io` بتوكن شخصي (PAT) بصلاحية `read:packages` - ممكن نعمل ده بدل الخطوة دي لو تفضلي كده.)

## الخطوة 3 - جهزي سيرفر (VPS)

ده الجزء الوحيد اللي فيه دفع فعلي وحساب باسمك - محدش يقدر يعمله بدالك.

اختاري أي مزود (كلهم هيشتغلوا بنفس الطريقة):

| المزود | التكلفة تقريبًا | ملاحظة |
|---|---|---|
| Hetzner | ~$5-6/شهر | أرخص، أداء ممتاز |
| DigitalOcean | ~$12/شهر | سهل جدًا للمبتدئين |
| Contabo | ~$6/شهر | موارد كتير بسعر رخيص |

عند الإنشاء اختاري:
- نظام: **Ubuntu 22.04 أو 24.04**
- الحجم: 2 vCPU / 4GB RAM كحد أدنى (Temporal + Postgres + Elasticsearch محتاجين رام)

بعد ما السيرفر يشتغل، هتاخدي **IP address** بتاعه.

## الخطوة 4 - اربطي دومين بالسيرفر

من لوحة تحكم الدومين بتاعك (Namecheap, GoDaddy, أيًا كان):
- ضيفي **A record**: `app.yourdomain.com` → IP بتاع السيرفر.

## الخطوة 5 - جهزي السيرفر (SSH)

اتصلي بالسيرفر:

```bash
ssh root@<server-ip>
```

ثبتي Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

## الخطوة 6 - انزلي ملفات النشر على السيرفر

```bash
mkdir -p /opt/postiz && cd /opt/postiz
curl -O https://raw.githubusercontent.com/manalmarzouk2020-bit/postiz-app/claude/ai-sales-brain-saas-mqw8qo/docker-compose.prod.yaml
curl -O https://raw.githubusercontent.com/manalmarzouk2020-bit/postiz-app/claude/ai-sales-brain-saas-mqw8qo/Caddyfile
curl -O https://raw.githubusercontent.com/manalmarzouk2020-bit/postiz-app/claude/ai-sales-brain-saas-mqw8qo/.env.production.example
mv .env.production.example .env
```

## الخطوة 7 - عدّلي ملف `.env`

```bash
nano .env
```

القيم اللي **لازم** تتغير:

| المتغير | القيمة |
|---|---|
| `DOMAIN` | الدومين بتاعك، مثلاً `app.yourdomain.com` |
| `MAIN_URL`, `FRONTEND_URL` | `https://` + نفس الدومين |
| `NEXT_PUBLIC_BACKEND_URL` | `https://` + الدومين + `/api` |
| `JWT_SECRET` | نتيجة `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | نتيجة `openssl rand -hex 24` |
| `TEMPORAL_POSTGRES_PASSWORD` | نتيجة تانية مختلفة من نفس الأمر |
| `DATABASE_URL` | حطي فيه نفس `POSTGRES_PASSWORD` اللي اخترتيه |
| `POSTIZ_IMAGE` | `ghcr.io/manalmarzouk2020-bit/postiz-salesbrain:latest` |
| `OPENAI_API_KEY` | مفتاح OpenAI بتاعك (لازم عشان الـ AI يشتغل) |

## الخطوة 8 - شغّلي كل حاجة

```bash
cd /opt/postiz
docker compose -f docker-compose.prod.yaml up -d
```

أول تشغيل بياخد دقيقة لحد ما Temporal وقاعدة البيانات يبقوا جاهزين. تابعي بـ:

```bash
docker compose -f docker-compose.prod.yaml logs -f postiz
```

بعد شوية، افتحي `https://app.yourdomain.com` في المتصفح - المفروض تلاقي صفحة
تسجيل الدخول بتاعة Postiz، وشهادة SSL شغالة تلقائيًا.

## الخطوة 9 - وصّلي القنوات (واتساب/تليجرام/ماسنجر/انستجرام)

من داخل التطبيق: **Sales Brain → Channels**. الـ webhook URLs اللي هتظهر هناك
دلوقتي هتكون شغالة فعليًا لأن الدومين بقى live، مش localhost.

## تحديث لاحق (لما تعدّلي كود جديد)

كل ما تعملي `git push`:

```bash
cd /opt/postiz
docker compose -f docker-compose.prod.yaml pull postiz
docker compose -f docker-compose.prod.yaml up -d postiz
```

---

## إيه اللي عملته أنا، وإيه اللي محتاج منك فعليًا

**جاهز بالكامل في الريبو (مش محتاج منك حاجة تانية):**
- بناء الصورة تلقائيًا (GitHub Action)
- ملف `docker-compose.prod.yaml` كامل (التطبيق + قاعدة بيانات + Redis + Temporal + HTTPS تلقائي)
- ملف `.env.production.example` بكل المتغيرات موضحة

**محتاج منك تنفيذه بنفسك (حسابات ومدفوعات باسمك، مينفعش حد يعملها بدالك):**
1. تفعيل صلاحية الكتابة لـ Actions (دقيقة واحدة، مرة واحدة)
2. عمل الـ package Public (دقيقة واحدة)
3. إنشاء حساب VPS ودفع الاشتراك
4. شراء/ربط الدومين
5. تنفيذ أوامر SSH اللي فوق (نسخ ولزق بس)

لو عايزة، أقدر أوجّهك خطوة خطوة لحظة بلحظة وانتِ بتنفذي - قوليلي بس لما تكوني
جاهزة تبدئي بالخطوة 3 (اختيار مزود الـ VPS) ونكمل مع بعض.
