import { forwardRef, Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { ArticleModule } from '../articles/article.module';
import { WelcomeService } from '../welcome/welcome.service';
import { NotificationService } from '../notification/notification.service';
import { I18nService } from "../i18n/i18n.service";

@Module({
  imports: [forwardRef(() => AuthModule.register()), StorageModule, ArticleModule,],
  controllers: [UserController],
  providers: [UserService, WelcomeService, NotificationService, I18nService],
  exports: [UserService],
})
export class UserModule {}
