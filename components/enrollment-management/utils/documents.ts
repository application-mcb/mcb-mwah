export const viewDocumentUtil = (
  doc: {
    fileUrl: string
    fileName: string
    fileType: string
    fileFormat: string
  },
  setViewingDocument: (v: any) => void,
  setShowDocumentModal: (v: boolean) => void
) => {
  setViewingDocument({
    url: doc.fileUrl,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileFormat: doc.fileFormat,
  })
  setShowDocumentModal(true)
}

export const closeDocumentModalUtil = (
  setViewingDocument: (v: any) => void,
  setShowDocumentModal: (v: boolean) => void
) => {
  setShowDocumentModal(false)
  setViewingDocument(null)
}


