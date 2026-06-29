import { CirclePlus, TrashBin, BranchesRight } from "@gravity-ui/icons";
import { FIELD_TYPE_ICONS } from "../../constants/editor-constants";
import { useEditorContext } from "./EditorContext";

interface NavigatorProps {
    /** Drawer open state on tablet/mobile (< lg). Ignored on desktop. */
    mobileOpen?: boolean;
    /** Called after picking a field — closes the drawer and opens the properties panel. */
    onFieldPick?: () => void;
    /** Called after switching page — closes the drawer so the canvas is visible. */
    onPagePick?: () => void;
}

export const Navigator = ({ mobileOpen = false, onFieldPick, onPagePick }: NavigatorProps = {}) => {
    const {
        schema, pages, totalPages, currentPage, setCurrentPage,
        selectedField, setSelectedField, setRightTab, rightTab,
        contextMenu, setContextMenu, contextMenuRef, removePage, addPage,
    } = useEditorContext();

    return (
        <>
            <div
                className="arbo-panel arbo-editor-side arbo-editor-side-left w-[82vw] max-w-[280px] xl:w-48 xl:max-w-none shrink-0 flex flex-col overflow-hidden"
                data-open={mobileOpen}
            >
                <div className="arbo-panel-header flex items-center justify-between">
                    <span>Navigator</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {pages.map((pageNum, idx) => {
                        const pageFields = schema.fields.filter(
                            (f) => (f.page ?? 0) === pageNum && !f.name?.startsWith("__page_break_")
                        );
                        return (
                            <div key={pageNum} className="mb-1">
                                <div className="flex items-center group">
                                    <button
                                        onClick={() => { setCurrentPage(idx); onPagePick?.(); }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (totalPages > 1) {
                                                setContextMenu({ x: e.clientX, y: e.clientY, pageIdx: idx, pageNum });
                                            }
                                        }}
                                        className={`arbo-tree-item flex-1 text-left font-semibold text-xs ${
                                            currentPage === idx ? "active" : ""
                                        }`}
                                    >
                                        <span className="text-[10px]">{currentPage === idx ? "▼" : "▶"}</span>
                                        Page {idx + 1}
                                        <span className="ml-auto text-[10px] arbo-text-muted">{pageFields.length}</span>
                                    </button>
                                    {totalPages > 1 && (
                                        <button
                                            onClick={() => removePage(pageNum)}
                                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--arbo-text-muted)] hover:text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)]"
                                            title="Delete page"
                                        >
                                            <TrashBin className="size-3" />
                                        </button>
                                    )}
                                </div>
                                {currentPage === idx && pageFields.map((field) => (
                                    <button
                                        key={field.name}
                                        onClick={() => { setSelectedField(field.name); setRightTab("field"); onFieldPick?.(); }}
                                        className={`arbo-tree-item w-full text-left pl-7 text-xs ${
                                            selectedField === field.name ? "active" : ""
                                        }`}
                                    >
                                        <span className="text-[10px] font-mono w-4 text-center arbo-text-muted">
                                            {FIELD_TYPE_ICONS[field.componentType] || "?"}
                                        </span>
                                        <span className="truncate">{field.label || field.name}</span>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                    <button onClick={addPage} className="arbo-tree-item w-full text-left text-xs arbo-text-muted mt-1">
                        <CirclePlus className="size-3.5" />
                        Add Page
                    </button>
                </div>
                {/* Logic canvas toggle */}
                <div className="border-t border-[var(--arbo-border)] p-2 shrink-0">
                    <button
                        onClick={() => setRightTab(rightTab === "logic" ? "field" : "logic")}
                        className={`arbo-tree-item w-full text-left text-xs font-semibold ${rightTab === "logic" ? "active" : "arbo-text-muted"}`}
                        title="Editor de lógica condicional"
                    >
                        <BranchesRight className="size-3.5" />
                        Lógica
                    </button>
                </div>
            </div>

            {/* Context menu for pages */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-50 rounded-lg overflow-hidden shadow-lg border border-[var(--arbo-border)]"
                    style={{ left: contextMenu.x, top: contextMenu.y, background: "var(--arbo-surface-2)" }}
                >
                    <button
                        onClick={() => removePage(contextMenu.pageNum)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs w-full text-left text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] transition-colors"
                    >
                        <TrashBin className="size-3.5" />
                        Delete Page {contextMenu.pageIdx + 1}
                    </button>
                </div>
            )}
        </>
    );
};
