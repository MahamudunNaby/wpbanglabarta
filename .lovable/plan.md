

# Auto-Reply তে AI ইন্টিগ্রেশন — পরিকল্পনা

## সারাংশ
অটো-রিপ্লাই ফিচারে Lovable AI (Google Gemini) ইন্টিগ্রেট করা হবে যাতে কি-ওয়ার্ড ম্যাচ না হলেও AI স্বয়ংক্রিয়ভাবে বুদ্ধিমান রিপ্লাই জেনারেট করতে পারে। ব্যবহারকারী প্রতিটি অটো-রিপ্লাই রুলে "AI রিপ্লাই" অপশন চালু করতে পারবেন।

## পূর্বশর্ত
- প্রথমে Lovable Cloud (Supabase) সেটআপ করতে হবে — এখনো কোনো Supabase কানেকশন নেই
- পুরো অ্যাপটি এখনো তৈরি হয়নি (placeholder state), তাই আগের প্ল্যান অনুযায়ী পুরো অ্যাপ বিল্ড করতে হবে, তারপর AI ইন্টিগ্রেশন যোগ হবে

## কী তৈরি হবে

### 1. Supabase Edge Function — `ai-auto-reply`
- Lovable AI Gateway (`google/gemini-3-flash-preview`) ব্যবহার করে রিপ্লাই জেনারেট করবে
- System prompt এ ব্যবসার context ও Bengali ভাষায় উত্তর দেওয়ার নির্দেশ থাকবে
- Input: ইনকামিং মেসেজ + কাস্টম context/instructions
- Output: AI-generated রিপ্লাই টেক্সট
- 429/402 error handling সহ

### 2. Auto-Reply রুল টেবিলে পরিবর্তন
- `auto_replies` টেবিলে নতুন কলাম: `use_ai` (boolean), `ai_prompt` (text — AI কে কীভাবে রিপ্লাই দিতে হবে তার নির্দেশনা)
- যখন `use_ai = true`, কি-ওয়ার্ড ম্যাচ হলে fixed reply এর বদলে AI reply পাঠাবে
- একটি fallback AI rule ও থাকবে — কোনো কি-ওয়ার্ড ম্যাচ না হলে AI উত্তর দেবে

### 3. UI পরিবর্তন (অটো-রিপ্লাই পেজ)
- "নতুন রুল তৈরি করুন" ডায়ালগে একটি Toggle: **"AI রিপ্লাই ব্যবহার করুন"**
- Toggle চালু করলে নতুন ফিল্ড দেখাবে: **"AI নির্দেশনা"** (যেমন: "গ্রাহককে বাংলায় সাহায্য করুন, পণ্যের দাম জানান")
- টেবিলে নতুন কলাম: রিপ্লাই টাইপ দেখাবে — "নির্ধারিত" বা "AI" ব্যাজ সহ
- AI রিপ্লাই টেস্ট বাটন — একটি sample মেসেজ দিয়ে AI রিপ্লাই প্রিভিউ দেখা যাবে

### 4. সেটিংস পেজে AI কনফিগারেশন
- গ্লোবাল AI প্রম্পট সেটিং — সব AI রিপ্লাইতে কমন context (ব্যবসার নাম, পণ্য তালিকা ইত্যাদি)

## টেকনিক্যাল ডিটেইলস

**Edge Function flow:**
```text
Client → supabase.functions.invoke('ai-auto-reply') → Lovable AI Gateway → Response
```

**Database schema addition:**
```sql
ALTER TABLE auto_replies ADD COLUMN use_ai boolean DEFAULT false;
ALTER TABLE auto_replies ADD COLUMN ai_prompt text;
```

**Model:** `google/gemini-3-flash-preview` (fast, cost-effective)

**Important:** যেহেতু পুরো অ্যাপ এখনো তৈরি হয়নি, আগে সম্পূর্ণ অ্যাপ (সব পেজ, Supabase setup, auth) বিল্ড করা হবে, তারপর AI auto-reply ফিচার যোগ করা হবে।

