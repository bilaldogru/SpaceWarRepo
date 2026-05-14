// Düşman resimleri burada bir kere oluşturulur.
// Her düşman tipi kendi resmini bu listeden alır.
export const enemyImages = {
    '1': new Image(),
    '2': new Image(),
    '3': new Image(),
    '4': new Image(),
    '5': new Image()
};

enemyImages['1'].src = 'assets/images/dusman1.png';
enemyImages['2'].src = 'assets/images/dusman2.png';
enemyImages['3'].src = 'assets/images/dusman3.png';
enemyImages['4'].src = 'assets/images/dusman4.png';
enemyImages['5'].src = 'assets/images/dusman5.png';

// Bazı görsellerin orijinal yönü farklıdır.
// Bu değerler, çizim sırasında düşmanı doğru yöne çevirmek için kullanılır.
export const DUSMAN_GORSEL_YONU = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': Math.PI / 2,
    '5': -(3 * Math.PI) / 4
};

// Tüm düşmanların ortak özellikleri bu ana sınıfta tutulur.
export class Enemy {
    constructor(x, y, koridorNo, hiz, boyut, can, tip, image) {
        this.x = x;
        this.y = y;
        this.koridorNo = koridorNo;
        this.hiz = hiz;
        this.boyut = boyut;
        this.can = can;
        this.maxCan = can;
        this.tip = String(tip);
        this.image = image;
        this.markedForDeletion = false;

        // Zaman değeri bazı düşmanların zikzak veya özel hareketleri için kullanılır.
        this.zaman = Math.random() * 1000;

        if (DUSMAN_GORSEL_YONU[this.tip] !== undefined) {
            this.gorselOffset = DUSMAN_GORSEL_YONU[this.tip];
        }
        else {
            this.gorselOffset = 0;
        }
    }

    // Her karede düşmanın iç zamanını ilerletir.
    update(canvas, bolum) {
        this.zaman = this.zaman + 1;
    }

    // Düşmanı canvas üzerine çizer.
    // Resim yüklenmemişse kırmızı kare çizilir; böylece düşman tamamen görünmez olmaz.
    draw(ctx) {
        const yari = this.boyut / 2;

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.translate(this.x, this.y);

        if (this.aci !== undefined) {
            ctx.rotate(this.aci + this.gorselOffset);
        }

        if (this.image !== undefined && this.image !== null && this.image.complete === true && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, -yari, -yari, this.boyut, this.boyut);
        }
        else {
            ctx.fillStyle = '#ff4747';
            ctx.fillRect(-yari, -yari, this.boyut, this.boyut);
        }

        ctx.restore();
    }
}

// Tip 1: Temel düşman. Orta hızlı ve az canlıdır.
export class EnemyType1 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.9, boyut = 34, can = 45) {
        super(x, y, koridorNo, hiz, boyut, can, '1', enemyImages['1']);
    }
}

// Tip 2: Uzaktan ateş eden düşman.
export class EnemyType2 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.55, boyut = 42, can = 105) {
        super(x, y, koridorNo, hiz, boyut, can, '2', enemyImages['2']);
        this.atesAraligi = Math.floor(Math.random() * 80 + 150);
        this.atesSayaci = this.atesAraligi;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);

        if (bolum.lazerler === undefined || bolum.lazerler === null) {
            return;
        }

        this.atesSayaci = this.atesSayaci - 1;
        if (this.atesSayaci > 0) {
            return;
        }

        let hedefX = 0;
        let hedefY = this.y;
        if (bolum._gemi !== undefined && bolum._gemi !== null) {
            hedefX = bolum._gemi.x;
            hedefY = bolum._gemi.y;
        }

        const dx = hedefX - this.x;
        const dy = hedefY - this.y;

        let uzaklik = Math.hypot(dx, dy);
        if (uzaklik === 0) {
            uzaklik = 1;
        }

        const yonX = dx / uzaklik;
        const yonY = dy / uzaklik;
        const lazerHizi = 3.1;

        bolum.lazerler.push({
            x: this.x + yonX * (this.boyut / 2),
            y: this.y + yonY * (this.boyut / 2),
            hizX: yonX * lazerHizi,
            hizY: yonY * lazerHizi,
            hasar: 12
        });

        this.atesSayaci = this.atesAraligi;
    }
}

// Tip 3: Zikzak hareket eden düşman.
export class EnemyType3 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.8, boyut = 36, can = 70) {
        super(x, y, koridorNo, hiz, boyut, can, '3', enemyImages['3']);
        this.merkezY = y;
        this.salininim = Math.random() * Math.PI * 2;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);

        // Serbest hareket modunda düşman kendi bulunduğu yerde hafif dalgalanır.
        if (bolum.serbestHareketModu === true) {
            this.y = this.y + Math.sin((this.zaman + this.salininim) / 18) * 0.7;
            return;
        }

        if (bolum.koridorlar === undefined || bolum.koridorlar === null) {
            return;
        }

        if (bolum.koridorlar[this.koridorNo] === undefined) {
            return;
        }

        this.merkezY = bolum.koridorlar[this.koridorNo].y;
        this.y = this.merkezY + Math.sin((this.zaman + this.salininim) / 24) * 24;
    }
}

// Tip 4: Yavaş ama dayanıklı düşman. Belirli aralıklarla can yeniler.
export class EnemyType4 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.45, boyut = 54, can = 160) {
        super(x, y, koridorNo, hiz, boyut, can, '4', enemyImages['4']);
        this.rejenSayaci = 0;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);
        this.rejenSayaci = this.rejenSayaci + 1;

        if (this.rejenSayaci >= 90 && this.can < this.maxCan) {
            this.can = this.can + 4;
            if (this.can > this.maxCan) {
                this.can = this.maxCan;
            }
            this.rejenSayaci = 0;
        }
    }
}

// Tip 5: Komutan düşman. Yanına küçük destek düşmanı çağırır.
export class EnemyType5 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.38, boyut = 62, can = 220) {
        super(x, y, koridorNo, hiz, boyut, can, '5', enemyImages['5']);
        this.cagriAraligi = 260;
        this.cagriSayaci = 180;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);
        this.cagriSayaci = this.cagriSayaci - 1;

        if (this.cagriSayaci > 0) {
            return;
        }

        if (bolum.dusmanlar === undefined || bolum.dusmanlar === null) {
            return;
        }

        let hedefX = 0;
        let hedefY = this.y;
        if (bolum._gemi !== undefined && bolum._gemi !== null) {
            hedefX = bolum._gemi.x;
            hedefY = bolum._gemi.y;
        }

        const dx = hedefX - this.x;
        const dy = hedefY - this.y;

        let uzaklik = Math.hypot(dx, dy);
        if (uzaklik === 0) {
            uzaklik = 1;
        }

        let yon = 1;
        if (Math.random() < 0.5) {
            yon = -1;
        }

        const arkaX = this.x - (dx / uzaklik) * 46;
        const arkaY = this.y - (dy / uzaklik) * 46;
        const yanX = -(dy / uzaklik) * (yon * 34);
        const yanY = (dx / uzaklik) * (yon * 34);

        const minY = 155;
        const maxY = canvas.height - 70;
        const finalX = arkaX + yanX;
        let finalY = arkaY + yanY;

        if (finalY < minY) {
            finalY = minY;
        }
        else if (finalY > maxY) {
            finalY = maxY;
        }

        const destek = new EnemyType1(finalX, finalY, this.koridorNo, 1.05, 30, 35);
        bolum.dusmanlar.push(destek);
        this.cagriSayaci = this.cagriAraligi;
    }
}

// Verilen tipe göre doğru düşman sınıfını oluşturur.
export function dusmanOlustur(tip, x, y, koridorNo) {
    const secilenTip = String(tip);

    if (secilenTip === '2' || secilenTip === 'high') {
        return new EnemyType2(x, y, koridorNo);
    }
    else if (secilenTip === '3') {
        return new EnemyType3(x, y, koridorNo);
    }
    else if (secilenTip === '4' || secilenTip === 'queen') {
        return new EnemyType4(x, y, koridorNo);
    }
    else if (secilenTip === '5') {
        return new EnemyType5(x, y, koridorNo);
    }

    return new EnemyType1(x, y, koridorNo);
}

// Ağırlıklı rastgele seçim yapar.
// Ağırlığı yüksek olan düşman tipinin çıkma ihtimali daha fazladır.
export function dusmanTipiSec(dagilim) {
    let toplam = 0;

    for (let i = 0; i < dagilim.length; i++) {
        toplam = toplam + dagilim[i].agirlik;
    }

    let kalan = Math.random() * toplam;

    for (let i = 0; i < dagilim.length; i++) {
        const item = dagilim[i];
        kalan = kalan - item.agirlik;

        if (kalan <= 0) {
            return item.tip;
        }
    }

    if (dagilim.length > 0) {
        return dagilim[0].tip;
    }

    return '1';
}

export class NormalEnemy extends EnemyType1 {}
export class HighEnemy extends EnemyType2 {}
export class QueenEnemy extends EnemyType4 {}
