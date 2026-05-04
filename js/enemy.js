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
        this.zaman = Math.random() * 1000;
    }

    update(canvas, bolum) {
        this.zaman++;
    }

    draw(ctx) {
        const yari = this.boyut / 2;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x - yari, this.y - yari, this.boyut, this.boyut);
        } else {
            ctx.fillStyle = '#ff4747';
            ctx.fillRect(this.x - yari, this.y - yari, this.boyut, this.boyut);
        }

        ctx.restore();
    }
}

// 1: Duz ilerleyen orta hizli, az canli temel dusman.
export class EnemyType1 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.9, boyut = 34, can = 45) {
        super(x, y, koridorNo, hiz, boyut, can, '1', enemyImages['1']);
    }
}

// 2: Daha yavas, daha dayanikli ve aralikli ates eden dusman.
export class EnemyType2 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.55, boyut = 42, can = 105) {
        super(x, y, koridorNo, hiz, boyut, can, '2', enemyImages['2']);
        this.atesAraligi = Math.floor(Math.random() * 80 + 150);
        this.atesSayaci = this.atesAraligi;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);
        if (!bolum.lazerler) return;

        this.atesSayaci--;
        if (this.atesSayaci > 0) return;

        const hedefX = bolum._gemi ? bolum._gemi.x : 0;
        const hedefY = bolum._gemi ? bolum._gemi.y : this.y;
        const dx = hedefX - this.x;
        const dy = hedefY - this.y;
        const uzaklik = Math.sqrt(dx * dx + dy * dy) || 1;
        const hiz = 4.8;

        bolum.lazerler.push({
            x: this.x - this.boyut / 2,
            y: this.y,
            hizX: (dx / uzaklik) * hiz,
            hizY: (dy / uzaklik) * hiz,
            hasar: 12
        });

        this.atesSayaci = this.atesAraligi;
    }
}

// 3: Koridor icinde hafif zikzak yapan manevraci dusman.
export class EnemyType3 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.8, boyut = 36, can = 70) {
        super(x, y, koridorNo, hiz, boyut, can, '3', enemyImages['3']);
        this.merkezY = y;
        this.salininim = Math.random() * Math.PI * 2;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);
        if (bolum.serbestHareketModu) {
            this.y += Math.sin((this.zaman + this.salininim) / 18) * 0.7;
            return;
        }

        if (!bolum.koridorlar || !bolum.koridorlar[this.koridorNo]) return;

        this.merkezY = bolum.koridorlar[this.koridorNo].y;
        this.y = this.merkezY + Math.sin((this.zaman + this.salininim) / 24) * 24;
    }
}

// 4: Yavas ama kalin zırhli; hasar almadan kalirsa az miktarda yenilenir.
export class EnemyType4 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.45, boyut = 54, can = 160) {
        super(x, y, koridorNo, hiz, boyut, can, '4', enemyImages['4']);
        this.rejenSayaci = 0;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);
        this.rejenSayaci++;
        if (this.rejenSayaci >= 90 && this.can < this.maxCan) {
            this.can = Math.min(this.maxCan, this.can + 4);
            this.rejenSayaci = 0;
        }
    }
}

// 5: Komutan tipi; yavas ilerler ve arada temel dusman destegi cagirir.
export class EnemyType5 extends Enemy {
    constructor(x, y, koridorNo, hiz = 0.38, boyut = 62, can = 220) {
        super(x, y, koridorNo, hiz, boyut, can, '5', enemyImages['5']);
        this.cagriAraligi = 260;
        this.cagriSayaci = 180;
    }

    update(canvas, bolum) {
        super.update(canvas, bolum);
        this.cagriSayaci--;
        if (this.cagriSayaci > 0 || !bolum.dusmanlar) return;

        const yon = Math.random() < 0.5 ? -1 : 1;
        const minY = 155;
        const maxY = canvas.height - 70;
        const y = Math.max(minY, Math.min(maxY, this.y + yon * 34));
        const destek = new EnemyType1(this.x + 46, y, this.koridorNo, 1.05, 30, 35);
        bolum.dusmanlar.push(destek);
        this.cagriSayaci = this.cagriAraligi;
    }
}

export function dusmanOlustur(tip, x, y, koridorNo) {
    const secilenTip = String(tip);
    if (secilenTip === '2' || secilenTip === 'high') return new EnemyType2(x, y, koridorNo);
    if (secilenTip === '3') return new EnemyType3(x, y, koridorNo);
    if (secilenTip === '4' || secilenTip === 'queen') return new EnemyType4(x, y, koridorNo);
    if (secilenTip === '5') return new EnemyType5(x, y, koridorNo);
    return new EnemyType1(x, y, koridorNo);
}

export function dusmanTipiSec(dagilim) {
    const toplam = dagilim.reduce((sum, item) => sum + item.agirlik, 0);
    let kalan = Math.random() * toplam;

    for (const item of dagilim) {
        kalan -= item.agirlik;
        if (kalan <= 0) return item.tip;
    }

    return dagilim[0]?.tip || '1';
}

export class NormalEnemy extends EnemyType1 {}
export class HighEnemy extends EnemyType2 {}
export class QueenEnemy extends EnemyType4 {}
