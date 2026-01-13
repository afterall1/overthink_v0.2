-- =====================================================
-- LifeNexus Quest Templates Migration (FIXED)
-- Created: 2026-01-12
-- Description: Adds quest_templates table with 124 pre-defined
--              quest templates across 6 categories
-- NOTE: Slugs are now prefixed with category to ensure uniqueness
-- =====================================================

-- =====================================================
-- 1. CLEAN UP (if exists)
-- =====================================================
DROP TABLE IF EXISTS quest_templates CASCADE;

-- =====================================================
-- 2. QUEST TEMPLATES TABLE
-- =====================================================
CREATE TABLE quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_slug TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '⚡',
    xp_reward INTEGER DEFAULT 15 CHECK (xp_reward >= 5 AND xp_reward <= 50),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime')),
    estimated_minutes INTEGER,
    is_recurring_default BOOLEAN DEFAULT false,
    recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekdays', 'weekends', 'mwf', 'tts', 'custom')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_quest_templates_category ON quest_templates(category_slug);
CREATE INDEX IF NOT EXISTS idx_quest_templates_difficulty ON quest_templates(difficulty);

-- =====================================================
-- 4. RLS POLICIES (Public read for templates)
-- =====================================================
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates (they are global)
CREATE POLICY "Quest templates are publicly readable" ON quest_templates
    FOR SELECT USING (true);

-- Only admins can modify (via service role)
CREATE POLICY "Only service role can modify templates" ON quest_templates
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. SEED DATA: TRADE CATEGORY (16 templates)
-- =====================================================
INSERT INTO quest_templates (category_slug, slug, title, description, emoji, xp_reward, difficulty, time_of_day, estimated_minutes, is_recurring_default, recurrence_pattern, sort_order) VALUES
-- Pre-Market (Morning)
('trade', 'trade_market_scan', 'Futures ve pre-market taraması yap', 'Gece boyunca futures piyasalarını ve pre-market hareketlerini incele', '📊', 15, 'easy', 'morning', 15, true, 'weekdays', 1),
('trade', 'trade_news_review', 'Ekonomik takvim ve haberleri incele', 'Günün önemli ekonomik verilerini ve piyasa haberlerini oku', '📰', 10, 'easy', 'morning', 10, true, 'weekdays', 2),
('trade', 'trade_watchlist_update', 'Watchlist güncelle', 'Bugün takip edilecek maksimum 5 sembolü belirle', '📋', 10, 'easy', 'morning', 10, true, 'weekdays', 3),
('trade', 'trade_trading_plan', 'Günlük trading planı hazırla', 'Entry, exit, stop-loss ve hedef fiyatları belirle', '🎯', 20, 'medium', 'morning', 20, true, 'weekdays', 4),
('trade', 'trade_mental_prep', 'Pre-market meditasyon yap', '5 dakika nefes egzersizi veya meditasyon', '🧘', 10, 'easy', 'morning', 5, true, 'weekdays', 5),
('trade', 'trade_tech_check', 'Platform ve bağlantı kontrolü', 'Trading platformu, internet ve yedek sistemleri kontrol et', '🔌', 5, 'easy', 'morning', 5, true, 'weekdays', 6),
('trade', 'trade_scenario_rehearsal', 'Senaryo provası yap', '3 farklı piyasa senaryosunu zihinsel olarak prova et', '🎭', 15, 'medium', 'morning', 15, false, NULL, 7),
-- Market Hours
('trade', 'trade_execute_plan', 'Plana sadık kal', 'İmpulsif trade yapmadan plana sadık kal', '✅', 25, 'hard', 'anytime', 0, true, 'weekdays', 8),
('trade', 'trade_risk_check', 'Risk kontrolü yap', 'Stop-loss ve pozisyon büyüklüklerini kontrol et', '⚠️', 15, 'medium', 'anytime', 5, true, 'weekdays', 9),
('trade', 'trade_break_reminder', 'Trading molası ver', 'Her 90 dakikada 10 dakika ekrandan uzaklaş', '☕', 10, 'easy', 'anytime', 10, true, 'weekdays', 10),
('trade', 'trade_emotion_log', 'Duygu durumunu kaydet', 'Şu anki duygu durumunu 1-10 arası puanla', '💭', 10, 'easy', 'anytime', 2, true, 'weekdays', 11),
-- Post-Market
('trade', 'trade_trade_journal', 'Trade journal tut', 'Tüm işlemleri detaylı olarak kaydet', '📝', 25, 'medium', 'evening', 20, true, 'weekdays', 12),
('trade', 'trade_screenshot_chart', 'Grafik ekran görüntüsü al', 'Önemli grafiklerin ekran görüntüsünü kaydet', '📸', 10, 'easy', 'evening', 5, false, NULL, 13),
('trade', 'trade_pnl_review', 'Günlük P&L analizi yap', 'Günün kar/zarar durumunu değerlendir', '💰', 15, 'easy', 'evening', 10, true, 'weekdays', 14),
('trade', 'trade_lesson_extract', 'Öğrenilen dersleri yaz', 'Bugün öğrenilen 3 dersi yaz', '🎓', 20, 'medium', 'evening', 15, true, 'weekdays', 15),
('trade', 'trade_tomorrow_prep', 'Yarın için ön hazırlık', 'Yarının watchlist ve planını hazırlamaya başla', '📅', 15, 'medium', 'evening', 15, true, 'weekdays', 16),

-- =====================================================
-- 6. SEED DATA: FOOD CATEGORY (18 templates)
-- =====================================================
-- Morning
('food', 'food_morning_hydration', 'Sabah hidrasyonu', 'Uyanınca 1 bardak su iç', '💧', 5, 'easy', 'morning', 1, true, 'daily', 1),
('food', 'food_healthy_breakfast', 'Sağlıklı kahvaltı yap', 'Protein içeren dengeli bir kahvaltı yap', '🍳', 15, 'easy', 'morning', 20, true, 'daily', 2),
('food', 'food_plan_meals', 'Günün öğünlerini planla', 'Öğle ve akşam yemeklerini önceden planla', '📝', 10, 'easy', 'morning', 5, true, 'daily', 3),
('food', 'food_supplement_check', 'Vitamin/takviye al', 'Günlük vitamin ve takviyelerini al', '💊', 5, 'easy', 'morning', 1, true, 'daily', 4),
-- Daily Tracking
('food', 'food_water_intake', '8 bardak su tamamla', 'Günlük 8 bardak (2L) su hedefini tamamla', '🥤', 15, 'medium', 'anytime', 0, true, 'daily', 5),
('food', 'food_veggie_serving', '5 porsiyon sebze/meyve', 'Günde 5 porsiyon sebze ve meyve tüket', '🥗', 20, 'medium', 'anytime', 0, true, 'daily', 6),
('food', 'food_protein_goal', 'Protein hedefine ulaş', 'Günlük protein ihtiyacını karşıla', '🥩', 20, 'medium', 'anytime', 0, true, 'daily', 7),
('food', 'food_mindful_eating', 'Bilinçli beslenme', 'En az 1 öğünü telefonsuz ve dikkatli ye', '🧘', 15, 'medium', 'anytime', 30, true, 'daily', 8),
('food', 'food_food_log', 'Yemek günlüğü tut', 'Tüm öğünleri ve kalorileri kaydet', '📓', 10, 'easy', 'anytime', 5, true, 'daily', 9),
('food', 'food_snack_control', 'Atıştırmalık kontrolü', 'Sağlıksız atıştırmalık sayısını 1''de tut', '🍪', 15, 'medium', 'anytime', 0, true, 'daily', 10),
('food', 'food_portion_control', 'Porsiyon kontrolü', 'Tabak boyutuna ve porsiyona dikkat et', '🍽️', 10, 'easy', 'anytime', 0, true, 'daily', 11),
-- Meal Prep
('food', 'food_grocery_list', 'Market listesi hazırla', 'Haftalık sağlıklı market listesini oluştur', '🛒', 15, 'easy', 'anytime', 15, false, NULL, 12),
('food', 'food_batch_cook', 'Toplu yemek hazırla', '3+ porsiyon sağlıklı yemek hazırla', '🍲', 25, 'hard', 'anytime', 60, false, NULL, 13),
('food', 'food_prep_veggies', 'Sebzeleri hazırla', 'Haftalık sebzeleri yıka, doğra, sakla', '🥕', 15, 'medium', 'anytime', 20, false, NULL, 14),
('food', 'food_portion_containers', 'Öğünleri porsiyonla', 'Hazırlanan yemekleri kaplara böl', '📦', 10, 'easy', 'anytime', 15, false, NULL, 15),
-- Evening
('food', 'food_dinner_home', 'Evde yemek ye', 'Akşam yemeğini evde hazırla ve ye', '🏠', 15, 'easy', 'evening', 45, true, 'daily', 16),
('food', 'food_no_late_snack', 'Geç atıştırma yapma', 'Akşam 20:00''den sonra yeme', '🌙', 15, 'medium', 'evening', 0, true, 'daily', 17),
('food', 'food_next_day_prep', 'Yarının yemeğini hazırla', 'Yarının öğle yemeğini hazırla', '🍱', 20, 'medium', 'evening', 30, true, 'weekdays', 18),

-- =====================================================
-- 7. SEED DATA: SPORT CATEGORY (22 templates)
-- =====================================================
-- Morning
('sport', 'sport_morning_stretch', 'Sabah germe egzersizi', '5-10 dakika tüm vücut germe', '🧘', 10, 'easy', 'morning', 10, true, 'daily', 1),
('sport', 'sport_morning_workout', 'Sabah antrenmanı', '30+ dakika sabah egzersizi', '💪', 30, 'hard', 'morning', 45, true, 'daily', 2),
('sport', 'sport_cold_shower', 'Soğuk duş', 'En az 30 saniye soğuk duş al', '🚿', 15, 'medium', 'morning', 5, true, 'daily', 3),
('sport', 'sport_hydration_start', 'Hidrasyonla başla', '500ml su ile güne başla', '💧', 5, 'easy', 'morning', 2, true, 'daily', 4),
('sport', 'sport_breakfast_protein', 'Proteinli kahvaltı', 'Protein ağırlıklı kahvaltı yap', '🥚', 10, 'easy', 'morning', 20, true, 'daily', 5),
-- Workouts
('sport', 'sport_warmup_complete', 'Isınma tamamla', '5-10 dakika dinamik ısınma', '🔥', 10, 'easy', 'anytime', 10, true, 'daily', 6),
('sport', 'sport_strength_training', 'Ağırlık antrenmanı', 'Direnç/ağırlık antrenmanı yap', '🏋️', 30, 'hard', 'anytime', 60, false, NULL, 7),
('sport', 'sport_cardio_session', 'Kardiyo antrenmanı', '20+ dakika kardiyo (koşu, bisiklet, yüzme)', '🏃', 25, 'medium', 'anytime', 30, false, NULL, 8),
('sport', 'sport_hiit_workout', 'HIIT antrenmanı', 'Yüksek yoğunluklu interval antrenman', '⚡', 30, 'hard', 'anytime', 25, false, NULL, 9),
('sport', 'sport_yoga_session', 'Yoga seansı', '20+ dakika yoga pratiği', '🧘‍♀️', 20, 'medium', 'anytime', 30, false, NULL, 10),
('sport', 'sport_core_workout', 'Core antrenmanı', 'Karın ve core bölgesi egzersizleri', '🎯', 15, 'medium', 'anytime', 15, false, NULL, 11),
('sport', 'sport_flexibility_work', 'Esneklik çalışması', 'Esneklik ve mobilite egzersizleri', '🤸', 15, 'medium', 'anytime', 20, false, NULL, 12),
('sport', 'sport_cooldown_stretch', 'Soğuma germeleri', 'Antrenman sonrası germe egzersizleri', '😌', 10, 'easy', 'anytime', 10, true, 'daily', 13),
-- Daily Movement
('sport', 'sport_step_goal', '10.000 adım tamamla', 'Günlük 10.000 adım hedefine ulaş', '👟', 20, 'medium', 'anytime', 0, true, 'daily', 14),
('sport', 'sport_stairs_choice', 'Merdiven tercih et', 'Asansör yerine merdiven kullan', '🪜', 10, 'easy', 'anytime', 5, true, 'daily', 15),
('sport', 'sport_walk_break', 'Yürüyüş molası', 'Her saat 5 dakika yürüyüş', '🚶', 10, 'easy', 'anytime', 5, true, 'daily', 16),
('sport', 'sport_standing_desk', 'Ayakta çalış', '2+ saat ayakta çalış', '🧍', 10, 'easy', 'anytime', 120, false, NULL, 17),
('sport', 'sport_active_commute', 'Aktif ulaşım', 'Yürüyerek veya bisikletle işe git', '🚴', 20, 'medium', 'morning', 30, true, 'weekdays', 18),
-- Recovery
('sport', 'sport_workout_log', 'Antrenman kaydet', 'Antrenmanı detaylı olarak kaydet', '📝', 10, 'easy', 'anytime', 5, true, 'daily', 19),
('sport', 'sport_weight_track', 'Kilo takibi', 'Kilonu kaydet', '⚖️', 5, 'easy', 'morning', 2, true, 'daily', 20),
('sport', 'sport_sleep_quality', '7+ saat uyku', 'En az 7 saat kaliteli uyku al', '😴', 20, 'medium', 'evening', 0, true, 'daily', 21),
('sport', 'sport_foam_rolling', 'Foam roller/masaj', 'Kas gevşetme ve masaj yap', '🧴', 15, 'easy', 'evening', 15, false, NULL, 22),

-- =====================================================
-- 8. SEED DATA: DEV CATEGORY (24 templates)
-- =====================================================
-- Morning Prep
('dev', 'dev_morning_standup', 'Günün 3 önceliğini belirle', 'Bugün odaklanılacak en önemli 3 görevi yaz', '🎯', 10, 'easy', 'morning', 10, true, 'weekdays', 1),
('dev', 'dev_learning_time', 'Öğrenme zamanı', '15-30 dakika yeni teknoloji/konsept öğren', '📚', 20, 'medium', 'morning', 30, true, 'daily', 2),
('dev', 'dev_inbox_zero', 'E-posta/Slack temizliği', 'Gelen kutusunu sıfırla veya organize et', '📧', 10, 'easy', 'morning', 15, true, 'weekdays', 3),
('dev', 'dev_environment_check', 'Dev ortamı kontrolü', 'IDE, dependencies ve build kontrol et', '🔧', 5, 'easy', 'morning', 5, true, 'weekdays', 4),
-- Deep Work
('dev', 'dev_deep_work_block', '90 dakika deep work', 'Kesintisiz, odaklanmış kodlama seansı', '🧠', 35, 'hard', 'anytime', 90, true, 'weekdays', 5),
('dev', 'dev_pomodoro_set', '4 pomodoro tamamla', '25 dakikalık 4 pomodoro seansı', '🍅', 30, 'hard', 'anytime', 120, true, 'weekdays', 6),
('dev', 'dev_feature_complete', 'Bir özellik tamamla', 'Bir feature''ı baştan sona tamamla', '✨', 40, 'hard', 'anytime', 180, false, NULL, 7),
('dev', 'dev_bug_fix', 'Bug çöz', 'Bir bug''ı tespit et ve düzelt', '🐛', 20, 'medium', 'anytime', 30, false, NULL, 8),
('dev', 'dev_code_review', 'Kod incelemesi yap', 'PR veya kod incelemesi gerçekleştir', '👀', 20, 'medium', 'anytime', 30, true, 'weekdays', 9),
('dev', 'dev_refactor_session', 'Refactoring yap', 'Mevcut kodu iyileştir ve temizle', '🔄', 25, 'medium', 'anytime', 45, false, NULL, 10),
-- Code Quality
('dev', 'dev_unit_test_write', 'Unit test yaz', 'Yeni veya mevcut kod için test yaz', '🧪', 25, 'medium', 'anytime', 30, false, NULL, 11),
('dev', 'dev_documentation', 'Dokümantasyon güncelle', 'README veya kod dokümantasyonu ekle/güncelle', '📖', 15, 'easy', 'anytime', 20, false, NULL, 12),
('dev', 'dev_clean_code', 'Temiz kod prensipleri', 'DRY, SOLID prensiplerine uy', '✨', 15, 'easy', 'anytime', 0, true, 'daily', 13),
('dev', 'dev_commit_atomic', 'Atomik commit''ler', 'Küçük, anlamlı commit''ler yap', '📦', 10, 'easy', 'anytime', 0, true, 'daily', 14),
('dev', 'dev_no_any_type', 'TypeScript strict', 'any kullanımından kaçın, tipler tanımla', '🔒', 20, 'medium', 'anytime', 0, true, 'daily', 15),
-- Learning
('dev', 'dev_read_article', 'Teknik makale oku', 'Bir teknik blog yazısı veya makale oku', '📰', 15, 'easy', 'anytime', 15, true, 'daily', 16),
('dev', 'dev_watch_tutorial', 'Tutorial izle', 'Eğitim videosu veya konferans izle', '🎬', 15, 'easy', 'anytime', 30, false, NULL, 17),
('dev', 'dev_side_project', 'Side project çalış', 'Kişisel projeye zaman ayır', '🚀', 25, 'medium', 'evening', 60, false, NULL, 18),
('dev', 'dev_new_tool_explore', 'Yeni araç keşfet', 'Yeni kütüphane veya araç dene', '🛠️', 20, 'medium', 'anytime', 30, false, NULL, 19),
('dev', 'dev_mentor_session', 'Mentörlük al/ver', 'Mentee veya mentor ile görüş', '🤝', 25, 'medium', 'anytime', 30, false, NULL, 20),
-- End of Day
('dev', 'dev_daily_review', 'Günü değerlendir', 'Bugün yapılanları gözden geçir', '📊', 10, 'easy', 'evening', 10, true, 'weekdays', 21),
('dev', 'dev_journal_entry', 'Öğrenilenleri yaz', 'Bugün öğrenilenleri kaydet', '✍️', 15, 'easy', 'evening', 10, true, 'daily', 22),
('dev', 'dev_tomorrow_plan', 'Yarını planla', 'Yarının görevlerini planla', '📅', 10, 'easy', 'evening', 10, true, 'weekdays', 23),
('dev', 'dev_git_push', 'Değişiklikleri push et', 'Günlük çalışmayı repository''ye gönder', '⬆️', 10, 'easy', 'evening', 5, true, 'weekdays', 24),

-- =====================================================
-- 9. SEED DATA: ETSY CATEGORY (19 templates)
-- =====================================================
-- Morning Intel
('etsy', 'etsy_trend_scan', 'Trend araştırması', 'Trend keyword ve niş araştırması yap', '🔍', 15, 'easy', 'morning', 15, true, 'weekdays', 1),
('etsy', 'etsy_competitor_check', 'Rakip analizi', 'Rakip listing ve fiyatlarını incele', '👀', 10, 'easy', 'morning', 10, true, 'weekdays', 2),
('etsy', 'etsy_stats_review', 'Shop Stats incele', 'Günlük ve haftalık istatistikleri değerlendir', '📊', 10, 'easy', 'morning', 10, true, 'weekdays', 3),
-- Customer Communication
('etsy', 'etsy_message_reply', 'Mesajları yanıtla', 'Tüm müşteri mesajlarına cevap ver', '💬', 20, 'medium', 'anytime', 20, true, 'daily', 4),
('etsy', 'etsy_order_update', 'Sipariş durumu güncelle', 'Siparişlerin durumunu müşterilere bildir', '📦', 10, 'easy', 'anytime', 10, true, 'daily', 5),
('etsy', 'etsy_review_response', 'Yorumlara cevap ver', 'Müşteri yorumlarına teşekkür/cevap yaz', '⭐', 15, 'easy', 'anytime', 10, true, 'daily', 6),
('etsy', 'etsy_follow_up', 'Satış sonrası takip', 'Teslim sonrası müşteri memnuniyeti kontrolü', '🤝', 15, 'medium', 'anytime', 15, false, NULL, 7),
-- Listing Optimization
('etsy', 'etsy_listing_optimize', 'Listing optimize et', '2-3 listing''i SEO için optimize et', '🎯', 25, 'medium', 'anytime', 25, true, 'weekdays', 8),
('etsy', 'etsy_seo_title_update', 'Başlıkları güncelle', 'Listing başlıklarına keyword ekle', '📝', 15, 'easy', 'anytime', 15, false, NULL, 9),
('etsy', 'etsy_tag_refresh', 'Tag''leri güncelle', '13 tag''i optimize et', '🏷️', 15, 'easy', 'anytime', 15, false, NULL, 10),
('etsy', 'etsy_photo_improve', 'Fotoğraf iyileştir', 'Ürün fotoğraflarını güncelle', '📸', 20, 'medium', 'anytime', 30, false, NULL, 11),
('etsy', 'etsy_description_polish', 'Açıklama zenginleştir', 'Ürün açıklamalarını geliştir', '✍️', 15, 'medium', 'anytime', 20, false, NULL, 12),
-- Order Management
('etsy', 'etsy_process_orders', 'Siparişleri işle', 'Yeni siparişleri hazırla', '📋', 20, 'medium', 'anytime', 30, true, 'daily', 13),
('etsy', 'etsy_package_prep', 'Paketleme yap', 'Ürünleri paketle', '📦', 15, 'easy', 'anytime', 20, true, 'daily', 14),
('etsy', 'etsy_ship_orders', 'Kargo gönder', 'Siparişleri kargoya ver', '🚚', 20, 'medium', 'anytime', 30, true, 'daily', 15),
('etsy', 'etsy_inventory_check', 'Stok kontrolü', 'Malzeme ve ürün stoklarını kontrol et', '📦', 10, 'easy', 'anytime', 15, true, 'weekdays', 16),
-- Growth
('etsy', 'etsy_new_listing', 'Yeni ürün ekle', 'Mağazaya yeni ürün listele', '➕', 30, 'hard', 'anytime', 45, false, NULL, 17),
('etsy', 'etsy_social_post', 'Sosyal medya paylaşımı', 'Instagram/Pinterest''te ürün paylaş', '📱', 15, 'easy', 'anytime', 15, true, 'daily', 18),
('etsy', 'etsy_sales_analyze', 'Satış analizi', 'Satış trendlerini ve verileri analiz et', '📈', 15, 'easy', 'evening', 15, true, 'weekdays', 19),

-- =====================================================
-- 10. SEED DATA: GAMING CATEGORY (25 templates)
-- =====================================================
-- Morning Prep
('gaming', 'gaming_morning_workout', 'Sabah egzersizi', '20-30 dakika fiziksel aktivite', '💪', 20, 'medium', 'morning', 30, true, 'daily', 1),
('gaming', 'gaming_hand_stretch', 'El/bilek germe', 'Oyun öncesi el ve bilek germe egzersizleri', '🖐️', 10, 'easy', 'morning', 5, true, 'daily', 2),
('gaming', 'gaming_hydration_start', 'Hidrasyon başlat', 'Bol su ile güne başla', '💧', 5, 'easy', 'morning', 2, true, 'daily', 3),
('gaming', 'gaming_gear_check', 'Ekipman kontrolü', 'Mouse, klavye, kulaklık kontrolü', '🎮', 5, 'easy', 'morning', 5, true, 'daily', 4),
('gaming', 'gaming_goal_set', 'Günlük hedef belirle', 'Bugünkü gaming hedefini yaz', '🎯', 10, 'easy', 'morning', 5, true, 'daily', 5),
-- Warmup
('gaming', 'gaming_aim_trainer', 'Aim antrenmanı', '15 dakika Aim Lab veya Kovaak''s', '🎯', 15, 'easy', 'anytime', 15, true, 'daily', 6),
('gaming', 'gaming_deathmatch_warmup', 'Isınma maçı', 'Düşük stresli ısınma oyunu', '🔥', 10, 'easy', 'anytime', 15, true, 'daily', 7),
('gaming', 'gaming_reflex_drill', 'Refleks antrenmanı', 'Refleks ve reaksiyon çalışması', '⚡', 15, 'easy', 'anytime', 10, true, 'daily', 8),
-- Training
('gaming', 'gaming_ranked_session', 'Ranked oyna', '2+ saat competitive/ranked oyna', '🏆', 30, 'hard', 'anytime', 120, true, 'daily', 9),
('gaming', 'gaming_scrim_complete', 'Takım antrenmanı', 'Takımla scrim veya pratik tamamla', '👥', 35, 'hard', 'anytime', 180, false, NULL, 10),
('gaming', 'gaming_mechanical_drill', 'Mekanik drill', 'Oyuna özel mekanik skill çalışması', '🔧', 20, 'medium', 'anytime', 30, true, 'daily', 11),
('gaming', 'gaming_strategy_practice', 'Strateji çalışması', 'Harita kontrolü, rotasyon, pozisyon çalış', '🗺️', 20, 'medium', 'anytime', 30, false, NULL, 12),
('gaming', 'gaming_team_comms', 'İletişim pratiği', 'Takım iletişimi ve callout çalışması', '🎙️', 15, 'medium', 'anytime', 30, false, NULL, 13),
-- Analysis
('gaming', 'gaming_vod_review', 'VOD inceleme', 'Kendi oyununu izle ve analiz et', '📹', 25, 'medium', 'evening', 30, true, 'daily', 14),
('gaming', 'gaming_pro_vod_study', 'Pro VOD izle', 'Profesyonel oyuncu gameplay izle', '🎬', 20, 'easy', 'anytime', 30, false, NULL, 15),
('gaming', 'gaming_mistake_log', 'Hata kaydı tut', 'Yapılan hataları kaydet', '📝', 15, 'easy', 'evening', 10, true, 'daily', 16),
('gaming', 'gaming_improvement_note', 'Gelişim notu yaz', 'Geliştirilecek alanları belirle', '📈', 15, 'easy', 'evening', 10, true, 'daily', 17),
('gaming', 'gaming_meta_study', 'Meta araştır', 'Güncel meta ve patch notes incele', '📊', 15, 'easy', 'anytime', 20, false, NULL, 18),
-- Health & Recovery
('gaming', 'gaming_break_every_90', '90 dakikada mola', 'Her 90 dakikada ara ver', '⏰', 10, 'easy', 'anytime', 10, true, 'daily', 19),
('gaming', 'gaming_eye_break', '20-20-20 kuralı', '20 dakikada 20 saniye 20 feet uzağa bak', '👁️', 10, 'easy', 'anytime', 1, true, 'daily', 20),
('gaming', 'gaming_posture_check', 'Oturuş kontrolü', 'Ergonomik oturuş pozisyonunu kontrol et', '🪑', 10, 'easy', 'anytime', 1, true, 'daily', 21),
('gaming', 'gaming_stretch_session', 'Germe seansı', 'Gaming sonrası germe egzersizleri', '🧘', 15, 'easy', 'evening', 15, true, 'daily', 22),
('gaming', 'gaming_off_screen_hobby', 'Ekran dışı aktivite', 'Ekran dışı bir hobiye zaman ayır', '🎨', 20, 'medium', 'evening', 30, true, 'daily', 23),
-- Mental Performance
('gaming', 'gaming_meditation_session', 'Meditasyon yap', '10 dakika meditasyon veya nefes egzersizi', '🧘‍♂️', 15, 'easy', 'anytime', 10, true, 'daily', 24),
('gaming', 'gaming_tilt_control', 'Tilt yönetimi', 'Sinirlendiğinde mola ver', '😤', 20, 'medium', 'anytime', 15, true, 'daily', 25);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
