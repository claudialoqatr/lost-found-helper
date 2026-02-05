import { Unlink } from "lucide-react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ScanHistory } from "@/components/ScanHistory";
import { UnassignTagDialog } from "@/components/UnassignTagDialog";
import {
  ItemNameField,
  NotMyItemToggle,
  PrivacyToggle,
  ItemDetailsEditor,
  ContactDetailsCard,
  LoqatrIdCard,
  IconPicker,
  DescriptionField,
  ItemOwnerNameField,
} from "@/components/tag";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEditTagData } from "@/hooks/useEditTagData";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  PageLoadingState,
  PageHeader,
  BackButton,
  GradientButton,
  UnsavedChangesDialog,
} from "@/components/shared";

export default function EditTagPage() {
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
    itemOwnerName,
    setItemOwnerName,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
    hasChanges,
    handleSubmit,
    handleUnassign,
    saving,
    unassigning,
    showUnassignDialog,
    setShowUnassignDialog,
  } = useEditTagData({ code });

  const { showDialog, handleSave, handleDiscard, cancelNavigation, safeNavigate, isSaving } = useUnsavedChanges({
    hasChanges,
    onSave: handleSubmit,
  });

  if (loading) {
    return <PageLoadingState />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-12 pb-24">
        <div className="max-w-2xl mx-auto lg:max-w-5xl">
          <BackButton
            label="Back to My Tags"
            onClick={() => safeNavigate("/my-tags")}
            className="mb-6"
          />

          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <PageHeader
                title="Edit Item"
                description="Update the information for your tagged item. When found, the finder will see this information."
              />

              {/* Item Name with inline icon picker */}
              <ItemNameField
                itemName={itemName}
                setItemName={setItemName}
                iconPicker={<IconPicker value={iconName} onChange={setIconName} inline />}
              />

              {/* Compact contact details on mobile */}
              <div className="lg:hidden">
                <ContactDetailsCard
                  user={userProfile}
                  compact
                  alternateOwnerName={!isItemOwner ? itemOwnerName : undefined}
                />
              </div>

              {/* Not my item toggle */}
              <NotMyItemToggle
                isNotMyItem={!isItemOwner}
                onNotMyItemChange={(notMyItem) => handleItemOwnerChange(!notMyItem)}
              />

              {/* Item Owner Name - shown when toggle is on */}
              {!isItemOwner && (
                <ItemOwnerNameField
                  value={itemOwnerName}
                  onChange={setItemOwnerName}
                />
              )}

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

              {/* Scan History - mobile */}
              <div className="lg:hidden">{qrCode && <ScanHistory qrCodeId={qrCode.id} />}</div>

              {/* Loqatr ID - subtle inline display */}
              {qrCode && (
                <div className="pt-4 border-t">
                  <LoqatrIdCard loqatrId={qrCode.loqatr_id} />
                </div>
              )}

              {/* Submit Button - mobile */}
              <div className="lg:hidden space-y-3">
                <GradientButton
                  className="w-full"
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Update Item
                </GradientButton>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowUnassignDialog(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unassign Tag
                </Button>
              </div>
            </div>

            {/* Right Column - Desktop only */}
            <div className="hidden lg:block space-y-6 mt-0">
              <ContactDetailsCard 
                user={userProfile} 
                alternateOwnerName={!isItemOwner ? itemOwnerName : undefined} 
              />
              {qrCode && <ScanHistory qrCodeId={qrCode.id} />}

              {/* Actions - desktop */}
              <div className="space-y-3">
                <GradientButton
                  className="w-full"
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Update Item
                </GradientButton>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowUnassignDialog(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unassign Tag
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UnassignTagDialog
        open={showUnassignDialog}
        onOpenChange={setShowUnassignDialog}
        onConfirm={handleUnassign}
        isLoading={unassigning}
        tagId={qrCode?.loqatr_id}
      />

      <UnsavedChangesDialog
        open={showDialog}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onCancel={cancelNavigation}
        isSaving={isSaving}
      />
    </AppLayout>
  );
}
