import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCheckoutClick = () => {
    if (!user) {
      toast({ title: t("pleaseSignIn"), description: t("signInToOrder"), variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: t("cartIsEmpty"), description: t("addProductsFirst"), variant: "destructive" });
      return;
    }
    if (!profile?.phone || profile.phone.trim() === "") {
      toast({ 
        title: "Phone Number Required", 
        description: "⚠️ Please add your phone number in your Profile before placing an order.", 
        variant: "destructive" 
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmCheckout = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    // Prices and totals are computed server-side from the catalog
    const { data, error } = await supabase.functions.invoke("create-order", {
      body: {
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      },
    });

    if (error || !data?.order_id) {
      toast({ title: t("error"), description: t("error"), variant: "destructive" });
      setSubmitting(false);
      return;
    }

    clearCart();
    onOpenChange(false);
    toast({ title: t("orderPlaced"), description: t("orderSuccess") });
    navigate("/profile");
    setSubmitting(false);
  };


  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {t("yourCart")}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("cartEmpty")}</p>
                <Button onClick={() => { onOpenChange(false); navigate("/best-sellers"); }} className="mt-4">
                  {t("startShopping")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-muted rounded-xl">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                      <p className="text-primary font-semibold">${item.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 ms-auto text-destructive" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>{t("total")}</span>
                <span className="text-primary">${totalPrice.toFixed(2)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckoutClick} disabled={submitting}>
                {submitting ? t("processing") : t("checkout")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t("confirmOrder") || "Confirm Your Order"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-muted-foreground">{t("reviewOrderBeforeConfirm") || "Please review your order details before confirming:"}</p>
                
                <div className="bg-muted rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-foreground font-medium">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                      <span className="text-foreground font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2">
                    <span>{t("total") || "Total"}</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                  {profile?.full_name && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("name") || "Name"}</span>
                      <span className="text-foreground">{profile.full_name}</span>
                    </div>
                  )}
                  {profile?.address && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("shippingAddress") || "Shipping Address"}</span>
                      <span className="text-foreground text-right max-w-[200px]">{profile.address}</span>
                    </div>
                  )}
                  {!profile?.address && (
                    <p className="text-xs text-destructive">{t("noAddressWarning") || "⚠️ No shipping address set. You can add one in your Profile."}</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCheckout}>
              {t("confirmAndPlace") || "Confirm & Place Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CartDrawer;
