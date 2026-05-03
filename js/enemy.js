// --- DÜŞMAN GÖRSELLERİ ---
export const enemyImages = {
    normal: new Image(),
    high:   new Image(),
    queen:  new Image()
};
enemyImages.normal.src = 'assets/images/normal.png';
enemyImages.high.src   = 'assets/images/high.png';
enemyImages.queen.src  = 'assets/images/queen.png';

// ================================================================
// TEMEL DÜŞMAN SINIFI
// ================================================================
export class Enemy {
    constructor(x, y, koridorNo, hiz, boyut, can, tip, image) {
        this.x         = x;
        this.y         = y;
        this.koridorNo = koridorNo;
        this.hiz       = hiz;
        this.boyut     = boyut;
        this.can       = can;
        this.maxCan    = can;
        this.tip       = tip;
        this.image     = image;
        this.markedForDeletion = false;
    }

    // bolum: aktif bölüm objesi (lazerler dizisine erişmek, dusmanEkle çağırmak için)
    update(canvas, bolum) { /* alt sınıflar override eder */ }

    draw(ctx) {
        const yari = this.boyut / 2;
        ctx.save();
        ctx.fillStyle = this.tip === 'queen' ? '#f39c12'
                      : this.tip === 'high'  ? '#8e44ad' : '#ff4747';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - yari, this.y - yari, this.boyut, this.boyut);
        ctx.strokeRect(this.x - yari, this.y - yari, this.boyut, this.boyut);
        ctx.restore();
    }
}

// ================================================================
// 1. NORMAL DÜŞMAN — Kamikaze: düz ilerler, özel yetenek yok
// ================================================================
export class NormalEnemy extends Enemy {
    constructor(x, y, koridorNo, hiz, boyut, can) {
        super(x, y, koridorNo, hiz, boyut, can, 'normal', enemyImages.normal);
    }
    update(canvas, bolum) { /* kamikaze — sadece hareket eder */ }
}

// ================================================================
// 2. HIGH DÜŞMAN — Lazer Atışı (gemiye veya üsse rastgele hedef)
// ================================================================
export class HighEnemy extends Enemy {
    constructor(x, y, koridorNo, hiz, boyut, can) {
        super(x, y, koridorNo, hiz, boyut, can, 'high', enemyImages.high);
        // Lazer atma sayacı: 120–200 kare arası (rastgele başlangıç)
        this.lazerTimer  = Math.floor(Math.random() * 80 + 120);
        this.lazerKalan  = this.lazerTimer;
    }

    update(canvas, bolum) {
        if (!bolum.lazerler) return;
        this.lazerKalan--;
        if (this.lazerKalan > 0) return;

        // %50 gemiye hedefle, %50 üsse düz at
        const gemiyeHedefle = Math.random() < 0.5 && bolum._gemi;
        const hedefX = gemiyeHedefle ? bolum._gemi.x : 0;
        const hedefY = gemiyeHedefle ? bolum._gemi.y : this.y;

        const dx = hedefX - this.x;
        const dy = hedefY - this.y;
        const uzak = Math.sqrt(dx * dx + dy * dy) || 1;
        const hiz  = 7;

        bolum.lazerler.push({
            x:    this.x - this.boyut / 2,
            y:    this.y,
            hizX: (dx / uzak) * hiz,
            hizY: (dy / uzak) * hiz,
            hasar: 15
        });
        this.lazerKalan = this.lazerTimer;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur  = 14;
        ctx.shadowColor = '#8e44ad';
        super.draw(ctx);
        ctx.restore();
    }
}

// ================================================================
// 3. QUEEN DÜŞMAN — Işınlanma (Y ekseni) + Minyon Doğurma
// ================================================================
export class QueenEnemy extends Enemy {
    constructor(x, y, koridorNo, hiz, boyut, can) {
        super(x, y, koridorNo, hiz, boyut, can, 'queen', enemyImages.queen);
        this.isinTimer    = 240;  // ~4 sn (60 fps)
        this.isinKalan    = 240;
        this.minyonTimer  = 150;  // ~2.5 sn (daha sık doğurur)
        this.minyonKalan  = 150;
        this.minyonFlash  = 0;    // Doğurma anında parlama süresi
    }

    update(canvas, bolum) {
        // --- IŞINLANMA: Y ekseninde rastgele zıpla ---
        this.isinKalan--;
        if (this.isinKalan <= 0) {
            const minY = 155;
            const maxY = canvas.height - 70;
            this.y = minY + Math.random() * (maxY - minY);
            this.isinKalan = this.isinTimer;
        }

        // --- MİNYON DOĞURMA: High veya Normal ---
        this.minyonKalan--;
        if (this.minyonKalan <= 0) {
            const minyonTip = Math.random() < 0.5 ? 'high' : 'normal';
            const k1 = Math.max(0, this.koridorNo - 1);
            const k2 = Math.min(4, this.koridorNo + 1);
            // .call(bolum) ile this bağlamı garantileniyor
            if (typeof bolum.dusmanEkle === 'function') {
                bolum.dusmanEkle.call(bolum, canvas, k1, 0,  minyonTip);
                bolum.dusmanEkle.call(bolum, canvas, k2, 60, minyonTip);
            }
            this.minyonFlash  = 20; // 20 kare boyunca kırmızı parlama
            this.minyonKalan  = this.minyonTimer;
        }
    }

    draw(ctx) {
        // Işınlanmaya 60 kare kala sarı parlama uyarısı
        if (this.isinKalan < 60) {
            ctx.save();
            ctx.globalAlpha = ((60 - this.isinKalan) / 60) * 0.65;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.boyut * 0.8, 0, Math.PI * 2);
            ctx.fillStyle   = '#f39c12';
            ctx.shadowBlur  = 40;
            ctx.shadowColor = '#f39c12';
            ctx.fill();
            ctx.restore();
        }
        // Doğurma flash efekti: kırmızı halka
        if (this.minyonFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.minyonFlash / 20;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.boyut * 1.2, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth   = 6;
            ctx.shadowBlur  = 30;
            ctx.shadowColor = '#ff4757';
            ctx.stroke();
            ctx.restore();
            this.minyonFlash--;
        }
        ctx.save();
        ctx.shadowBlur  = 22;
        ctx.shadowColor = '#f39c12';
        super.draw(ctx);
        ctx.restore();
    }
}
