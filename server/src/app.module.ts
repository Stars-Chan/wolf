import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomModule } from './room/room.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/werewolf'), RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
