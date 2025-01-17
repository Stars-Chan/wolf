import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomModule } from './room/room.module';
import { PlayerModule } from './player/player.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:123456@39.108.230.68:27017'),
    RoomModule,
    PlayerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
