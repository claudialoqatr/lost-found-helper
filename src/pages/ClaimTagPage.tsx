import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import {
  ItemNameField,
  NotMyItemToggle,
  PrivacyToggle,
  ItemDetailsEditor,
  ContactDetailsCard,
  LoqatrIdCard,
  IconPicker,
  DescriptionField,
} from "@/components/tag";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClaimTagData } from "@/hooks/useClaimTagData";
import { PageLoadingState, PageHeader, BackButton, GradientButton } from "@/components/shared";

export default function ClaimTagPage() {
  const { code } = useParams<{ code: string }>();
  const { userProfile } = useUserProfile();

  const {
    loading,
    qrCode,
    itemName,
    setItemName,
    isPublic,
    setIsPublic,
    description,
    setDescription,
    iconName,
    setIconName,
    itemDetails,
    isItemOwner,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
    itemOwnerName,
    handleSubmit,
    saving,
  } = useClaimTagData({ code });

  if (loading) {
    return <PageLoadingState />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-12 pb-24">
        <div className="max-w-2xl mx-auto lg:max-w-5xl">
          <BackButton className="mb-6" />

          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <PageHeader
                title="Claim This Tag"
                description="Enter any additional info. When your item is found, the finder will see this information along with your contact info."
              />

              {/* Item Name with inline icon picker */}
              <ItemNameField
                itemName={itemName}
                setItemName={setItemName}
                iconPicker={<IconPicker value={iconName} onChange={setIconName} inline />}
              />

              {/* Compact contact details on mobile */}
              <div className="lg:hidden">
                <ContactDetailsCard user={userProfile} compact alternateOwnerName={itemOwnerName} />
              </div>

              {/* Not my item toggle */}
              <NotMyItemToggle
                isNotMyItem={!isItemOwner}
                onNotMyItemChange={(notMyItem) => handleItemOwnerChange(!notMyItem)}
              />

              {/* Item Details */}
              <ItemDetailsEditor
                details={itemDetails}
                onAdd={addDetail}
                onRemove={removeDetail}
                onUpdate={updateDetail}
              />

              {/* Description */}
              <DescriptionField value={description} onChange={setDescription} />

              {/* Privacy Toggle */}
              <PrivacyToggle isPublic={isPublic} setIsPublic={setIsPublic} />

              {/* Loqatr ID - subtle inline display */}
              {qrCode && (
                <div className="pt-4 border-t">
                  <LoqatrIdCard loqatrId={qrCode.loqatr_id} />
                </div>
              )}

              {/* Submit Button - mobile */}
              <div className="lg:hidden">
                <GradientButton
                  className="w-full"
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Claim This Tag
                </GradientButton>
              </div>
            </div>

            {/* Right Column - Desktop only */}
            <div className="hidden lg:block space-y-6 mt-0">
              <ContactDetailsCard user={userProfile} alternateOwnerName={itemOwnerName} />

              {/* Submit Button - desktop */}
              <GradientButton
                className="w-full"
                onClick={handleSubmit}
                loading={saving}
                loadingText="Saving..."
              >
                Claim This Tag
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
