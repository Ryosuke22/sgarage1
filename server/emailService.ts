import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Gmail SMTP設定（環境変数で設定可能）
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (emailUser && emailPassword) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: {
          user: emailUser,
          pass: emailPassword, // アプリパスワードを使用
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // 接続テスト
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('Email configuration error:', error.message);
          console.log('Please check your EMAIL_USER and EMAIL_PASSWORD settings');
          this.transporter = null;
        } else {
          console.log('Email service ready for notifications');
        }
      });
    } else {
      console.log('Email credentials not provided. Email notifications disabled.');
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email to:', params.to);
      return false;
    }

    try {
      const mailOptions = {
        from: `ClassicAuction <${process.env.EMAIL_USER}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', params.to, 'MessageId:', info.messageId);
      console.log('Email subject:', params.subject);
      console.log('Check your Gmail inbox, spam folder, and promotions tab');
      return true;
    } catch (error) {
      console.error('Failed to send email to:', params.to, 'Error:', error.message);
      
      // より詳細なエラー情報を提供
      if (error.code === 'EAUTH') {
        console.error('Authentication failed. Please check:');
        console.error('1. EMAIL_USER is your full Gmail address');
        console.error('2. EMAIL_PASSWORD is your Gmail App Password (not regular password)');
        console.error('3. 2-factor authentication is enabled on your Google account');
        console.error('4. App Password was generated for "Mail" application');
      }
      
      return false;
    }
  }

  // 入札通知メール（出品者向け）
  async sendNewBidNotification(
    sellerEmail: string,
    listing: any,
    bid: any,
    bidderEmail: string
  ): Promise<boolean> {
    const subject = `新しい入札がありました - ${listing.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>新しい入札通知</h2>
        <p>あなたの出品「${listing.title}」に新しい入札がありました。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>入札詳細</h3>
          <p><strong>車両:</strong> ${listing.title}</p>
          <p><strong>入札額:</strong> ¥${bid.amount.toLocaleString()}</p>
          <p><strong>入札者:</strong> ${bidderEmail}</p>
          <p><strong>入札時刻:</strong> ${new Date(bid.createdAt).toLocaleString('ja-JP')}</p>
        </div>
        
        <p>オークション詳細を確認するには、<a href="${process.env.REPLIT_DOMAIN}/listing/${listing.slug}">こちら</a>をクリックしてください。</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          このメールはSamurai Garageから送信されています。<br>
          今後このようなメールを受信したくない場合は、アカウント設定から変更してください。
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: sellerEmail,
      subject,
      html,
    });
  }

  // 入札確認メール（入札者向け）
  async sendBidConfirmation(
    bidderEmail: string,
    listing: any,
    bid: any
  ): Promise<boolean> {
    const subject = `入札確認 - ${listing.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>入札確認</h2>
        <p>以下の車両への入札が正常に受け付けられました。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>入札詳細</h3>
          <p><strong>車両:</strong> ${listing.title}</p>
          <p><strong>入札額:</strong> ¥${bid.amount.toLocaleString()}</p>
          <p><strong>入札時刻:</strong> ${new Date(bid.createdAt).toLocaleString('ja-JP')}</p>
          <p><strong>オークション終了:</strong> ${new Date(listing.endDate).toLocaleString('ja-JP')}</p>
        </div>
        
        <p>オークションの進行状況を確認するには、<a href="${process.env.REPLIT_DOMAIN}/listing/${listing.slug}">こちら</a>をクリックしてください。</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          このメールはClassicAuctionから送信されています。
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: bidderEmail,
      subject,
      html,
    });
  }

  // 落札通知メール（落札者向け）
  async sendWinningNotification(
    winnerEmail: string,
    listing: any,
    winningBid: any,
    seller: any
  ): Promise<boolean> {
    const subject = `落札おめでとうございます - ${listing.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 落札おめでとうございます！</h2>
        <p>おめでとうございます！以下の車両を落札されました。</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>落札詳細</h3>
          <p><strong>車両:</strong> ${listing.title}</p>
          <p><strong>落札価格:</strong> ¥${winningBid.amount.toLocaleString()}</p>
          <p><strong>落札時刻:</strong> ${new Date(winningBid.createdAt).toLocaleString('ja-JP')}</p>
        </div>

        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>出品者情報</h3>
          <p><strong>出品者名:</strong> ${seller.firstName || ''} ${seller.lastName || ''}</p>
          <p><strong>連絡先:</strong> ${seller.email}</p>
          <p style="font-size: 14px; color: #666;">
            ※ 支払い方法と車両引き取りについて、出品者と直接連絡を取って調整してください
          </p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>次のステップ</h4>
          <ol>
            <li>上記の出品者に連絡して支払い方法を相談してください</li>
            <li>車両引き取りの日程を調整してください</li>
            <li>必要書類の準備をお願いします（車検証、譲渡証明書等）</li>
            <li>安全な取引のため、必ず現物確認後にお支払いください</li>
          </ol>
        </div>
        
        <p>オークション詳細を確認するには、<a href="${process.env.REPLIT_DOMAIN}/listing/${listing.slug}">こちら</a>をクリックしてください。</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h4 style="color: #721c24; margin-top: 0;">⚠️ 取引上の注意事項</h4>
          <ul style="color: #721c24; font-size: 14px; margin-bottom: 0;">
            <li>代金の支払いは必ず現物確認後に行ってください</li>
            <li>銀行振込以外の支払い方法（電子マネー、ギフトカード等）は避けてください</li>
            <li>個人情報の取り扱いには十分注意してください</li>
            <li>不審な要求があった場合は取引を中止し、サポートにご相談ください</li>
          </ul>
        </div>

        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          このメールはSamurai Garageから送信されています。<br>
          取引に関する問題やご不明な点がございましたら、サポートまでご連絡ください。<br>
          安全な取引のため、上記の注意事項を必ずお守りください。
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: winnerEmail,
      subject,
      html,
    });
  }

  // 落札完了通知メール（出品者向け）
  async sendAuctionEndNotification(
    sellerEmail: string,
    listing: any,
    winningBid: any,
    winnerEmail: string
  ): Promise<boolean> {
    const subject = `オークション終了 - ${listing.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>オークション終了通知</h2>
        <p>あなたの出品「${listing.title}」のオークションが終了しました。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>最終結果</h3>
          <p><strong>車両:</strong> ${listing.title}</p>
          <p><strong>落札価格:</strong> ¥${winningBid.amount.toLocaleString()}</p>
          <p><strong>落札者:</strong> ${winnerEmail}</p>
          <p><strong>落札時刻:</strong> ${new Date(winningBid.createdAt).toLocaleString('ja-JP')}</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>次のステップ</h4>
          <ol>
            <li>落札者に連絡して支払い方法を相談してください</li>
            <li>車両引き取りの日程を調整してください</li>
            <li>必要書類を準備してください</li>
          </ol>
        </div>
        
        <p>オークション詳細を確認するには、<a href="${process.env.REPLIT_DOMAIN}/listing/${listing.slug}">こちら</a>をクリックしてください。</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          このメールはClassicAuctionから送信されています。
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: sellerEmail,
      subject,
      html,
    });
  }

  // 入札負けメール（他の入札者向け）
  async sendOutbidNotification(
    bidderEmail: string,
    listing: any,
    previousBid: any,
    currentHighestBid: any
  ): Promise<boolean> {
    const subject = `他の入札者に上回られました - ${listing.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>入札更新通知</h2>
        <p>申し訳ございませんが、あなたの入札が他の入札者によって上回られました。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>入札状況</h3>
          <p><strong>車両:</strong> ${listing.title}</p>
          <p><strong>あなたの入札額:</strong> ¥${previousBid.amount.toLocaleString()}</p>
          <p><strong>現在の最高入札額:</strong> ¥${currentHighestBid.amount.toLocaleString()}</p>
          <p><strong>オークション終了:</strong> ${new Date(listing.endDate).toLocaleString('ja-JP')}</p>
        </div>
        
        <div style="background-color: #e1f5fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>まだ間に合います！</strong></p>
          <p>オークションはまだ継続中です。より高い金額で再入札することができます。</p>
          <p><a href="${process.env.REPLIT_DOMAIN}/listing/${listing.slug}" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">再入札する</a></p>
        </div>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          このメールはClassicAuctionから送信されています。
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: bidderEmail,
      subject,
      html,
    });
  }

  async sendEmailChangeVerification(newEmail: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/verify-email-change?token=${token}`;
    const subject = 'メールアドレス変更の確認 - Samurai Garage';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">メールアドレス変更の確認</h2>
        <p>こんにちは、${username}様</p>
        
        <p>メールアドレス変更のリクエストを受け付けました。新しいメールアドレスでのアカウント利用を開始するには、下記のリンクをクリックして認証を完了してください。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>新しいメールアドレス:</strong> ${newEmail}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            メールアドレス変更を確認する
          </a>
        </div>
        
        <p style="color: #666;">このリンクは24時間有効です。もしこの変更をリクエストしていない場合は、このメールを無視してください。</p>
        
        <p style="color: #666; font-size: 14px;">リンクをクリックできない場合は、以下のURLをブラウザにコピーしてアクセスしてください：<br>
        <span style="word-break: break-all;">${verificationUrl}</span></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          このメールは自動送信されています。<br>
          Samurai Garage - 日本のクラシックカー・オートバイ専門オークション
        </p>
      </div>
    `;
    
    return await this.sendEmail({ to: newEmail, subject, html });
  }
}

export const emailService = new EmailService();