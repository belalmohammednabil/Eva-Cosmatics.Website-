import { Facebook, Instagram, Twitter, Youtube, Send, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <footer className="bg-[hsl(0,0%,15%)] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-primary cursor-pointer" onClick={() => navigate("/")}>Eva Cosmetics</h3>
            <p className="text-sm text-white/80 mb-3">{t("footerDesc")}</p>
            <p className="text-sm text-white/70 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              +380 50 123 45 67
            </p>
            <p className="text-sm text-white/70 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              bloom@email.com
            </p>
            <p className="text-sm text-white/70 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Kyiv, Ukraine
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">{t("help")}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/about-us")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("contactUs")}</button></li>
              <li><button onClick={() => navigate("/about-us")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("faq")}</button></li>
              <li><button onClick={() => navigate("/about-us")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("shippingReturns")}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">{t("myAccount")}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/profile")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("addresses")}</button></li>
              <li><button onClick={() => navigate("/profile")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("orderStatus")}</button></li>
              <li><button onClick={() => navigate("/best-sellers")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("wishlist")}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">{t("customerCare")}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/about-us")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("aboutUs")}</button></li>
              <li><button onClick={() => navigate("/blog")} className="text-sm text-white/70 hover:text-primary transition-colors">{t("blog")}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">{t("signUpEmails")}</h4>
            <p className="text-sm text-white/70 mb-4">{t("newsletterDesc")}</p>
            <div className="flex gap-2">
              <Input type="email" placeholder={t("email")} className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary" />
              <Button size="icon" className="flex-shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              {[
                { Icon: Facebook, url: "https://facebook.com" },
                { Icon: Instagram, url: "https://instagram.com" },
                { Icon: Twitter, url: "https://twitter.com" },
                { Icon: Youtube, url: "https://youtube.com" },
              ].map(({ Icon, url }, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <span>© 2026 Eva Cosmetics</span>
              <button onClick={() => navigate("/about-us")} className="hover:text-primary transition-colors">{t("privacyPolicy")}</button>
              <button onClick={() => navigate("/about-us")} className="hover:text-primary transition-colors">{t("termsConditions")}</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
