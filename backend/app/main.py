from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routers import auth, users, events, friends, ai, messages, video, games

app = FastAPI(
    title="WeConnect API",
    version="1.0.0",
    description="API hệ thống WeConnect — kết nối người Việt học tiếng Nhật và người Nhật tại Hà Nội",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Thu hẹp lại trong production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Serve ảnh upload
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users & Profile"])
app.include_router(events.router, prefix="/api/v1/events", tags=["Events"])
app.include_router(friends.router, prefix="/api/v1", tags=["Friends"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI & Translation"])
app.include_router(messages.router, prefix="/api/v1", tags=["Messaging"])
app.include_router(video.router, prefix="/api/v1/video", tags=["Video Call"])
app.include_router(games.router, prefix="/api/v1/games", tags=["Games & Rooms"])


@app.on_event("startup")
def startup_event():
    # Cập nhật ảnh sự kiện mặc định trong database nếu chúng vẫn là link unsplash hoặc rỗng
    from app.database import SessionLocal
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        mapping = {
            "桜祭り": "/static/events/lehoianhdao.png",
            "Lễ hội hoa anh đào": "/static/events/lehoianhdao.png",
            "寿司作り体験": "/static/events/hoclamsushi.png",
            "Học làm Sushi": "/static/events/hoclamsushi.png",
            "富士山登山": "/static/events/leonuiphusi.png",
            "Leo núi Phú Sĩ": "/static/events/leonuiphusi.png",
            "留学セミナー": "/static/events/hoithaoduhoc.png",
            "Hội thảo du học": "/static/events/hoithaoduhoc.png",
            "J-POP交流会": "/static/events/giaoluujpop.png",
            "Giao lưu J-Pop": "/static/events/giaoluujpop.png",
            "マンガ展": "/static/events/trienlammanga.png",
            "Triển lãm Manga": "/static/events/trienlammanga.png",
            "書道ワークショップ": "/static/events/workshopthuphap.png",
            "Workshop Thư pháp": "/static/events/workshopthuphap.png",
            "トリン・コン・ソン音楽の夕べ": "/static/events/demnhactrinh.png",
            "Đêm nhạc Trịnh": "/static/events/demnhactrinh.png",
            "コミュニティサッカー": "/static/events/bongdacongdong.png",
            "Bóng đá cộng đồng": "/static/events/bongdacongdong.png",
            "日本語会話交流会": "/static/events/tiengnhatgiaotiep.png",
            "Tiếng Nhật giao tiếp": "/static/events/tiengnhatgiaotiep.png",
            "ITキャリアフェア": "/static/events/ngayhoivieclamit.png",
            "Ngày hội việc làm IT": "/static/events/ngayhoivieclamit.png",
            "茶道体験会": "/static/events/tiectradao.png",
            "Tiệc trà đạo": "/static/events/tiectradao.png",
            "生け花体験": "/static/events/camhoaikebana.png",
            "Cắm hoa Ikebana": "/static/events/camhoaikebana.png",
            "日本語スピーチコンテスト": "/static/events/hungbientiengnhat.png",
            "Hùng biện tiếng Nhật": "/static/events/hungbientiengnhat.png",
            "アニメファンオフ会": "/static/events/offlinefananime.png",
            "Offline fan anime": "/static/events/offlinefananime.png"
        }
        for title, img_url in mapping.items():
            db.execute(
                text("UPDATE EVENTS SET image_url = :img_url WHERE title = :title"),
                {"img_url": img_url, "title": title}
            )
        db.commit()
        print("Successfully updated default event images in database.")
    except Exception as e:
        print(f"Error updating event images: {e}")
        db.rollback()
    finally:
        db.close()



@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "version": "1.0.0"}
