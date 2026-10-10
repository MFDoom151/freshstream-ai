export type Locale = 'en' | 'ru' | 'kz';

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'kz', label: 'Kazakh', nativeLabel: 'Қазақша', flag: '🇰🇿' },
];

/**
 * 100% Type-Safe Dictionary Interface
 * Every key declared here must be implemented by en, ru, and kz.
 */
export interface TranslationDictionary {
  // Navigation & Header
  nav: {
    brand_name: string;
    brand_tag: string;
    home: string;
    problem: string;
    demo: string;
    roi: string;
    technology: string;
    market: string;
    contact: string;
    launch_demo: string;
    dashboard: string;
    shipments: string;
    analytics: string;
    support: string;
    launch_dashboard: string;
    theme_toggle: string;
    select_lang: string;
    menu_open: string;
    menu_close: string;
    live_badge: string;
    sign_in: string;
    sign_out: string;
  };

  // Global Footer
  footer: {
    brand_desc: string;
    cert_iso: string;
    cert_iot: string;
    links_title: string;
    technology_title: string;
    inquiries_title: string;
    rights: string;
    privacy: string;
    terms: string;
    address: string;
    email_invest: string;
    email_pilots: string;
  };

  // Route 1: Home / Hero
  hero: {
    badge: string;
    headline: string;
    subhead: string;
    cta_demo: string;
    cta_invest: string;
    cta_tech: string;
    metric_1_val: string;
    metric_1_lbl: string;
    metric_1_sub: string;
    metric_2_val: string;
    metric_2_lbl: string;
    metric_2_sub: string;
    metric_3_val: string;
    metric_3_lbl: string;
    metric_3_sub: string;
    val_prop_1_title: string;
    val_prop_1_desc: string;
    val_prop_2_title: string;
    val_prop_2_desc: string;
    val_prop_3_title: string;
    val_prop_3_desc: string;
    hud_temp: string;
    hud_ethanol: string;
    hud_rsl: string;
    hud_bhi: string;
    partner_title: string;
    core_innovations_badge: string;
    core_innovations_title: string;
    core_innovations_sub: string;
    teaser_badge: string;
    teaser_title: string;
    teaser_desc: string;
  };

  // Route 2: Problem vs Solution
  problem: {
    badge: string;
    title: string;
    subtitle: string;
    stat_loss_val: string;
    stat_loss_lbl: string;
    stat_loss_desc: string;
    stat_incident_val: string;
    stat_incident_lbl: string;
    stat_incident_desc: string;
    stat_penalty_val: string;
    stat_penalty_lbl: string;
    stat_penalty_desc: string;
    kuryk_title: string;
    kuryk_desc: string;
    loss_breakdown_title: string;
    loss_breakdown_sub: string;
    loss_spoilage: string;
    loss_spoilage_val: string;
    loss_reroute: string;
    loss_reroute_val: string;
    loss_demurrage: string;
    loss_demurrage_val: string;
    loss_admin: string;
    loss_admin_val: string;
    total_loss_val: string;
    matrix_title: string;
    matrix_subtitle: string;
    matrix_col_feature: string;
    matrix_col_loggers: string;
    matrix_col_ai_only: string;
    matrix_col_freshstream: string;
    matrix_row_sensing: string;
    matrix_row_sensing_loggers: string;
    matrix_row_sensing_ai: string;
    matrix_row_sensing_fs: string;
    matrix_row_connectivity: string;
    matrix_row_connectivity_loggers: string;
    matrix_row_connectivity_ai: string;
    matrix_row_connectivity_fs: string;
    matrix_row_biological: string;
    matrix_row_biological_loggers: string;
    matrix_row_biological_ai: string;
    matrix_row_biological_fs: string;
    matrix_row_window: string;
    matrix_row_window_loggers: string;
    matrix_row_window_ai: string;
    matrix_row_window_fs: string;
    matrix_row_maritime: string;
    matrix_row_maritime_loggers: string;
    matrix_row_maritime_ai: string;
    matrix_row_maritime_fs: string;
    matrix_row_intervention: string;
    matrix_row_intervention_loggers: string;
    matrix_row_intervention_ai: string;
    matrix_row_intervention_fs: string;
    matrix_row_saved_val: string;
    matrix_row_saved_val_loggers: string;
    matrix_row_saved_val_ai: string;
    matrix_row_saved_val_fs: string;
    matrix_row_payback: string;
    matrix_row_payback_loggers: string;
    matrix_row_payback_ai: string;
    matrix_row_payback_fs: string;
  };

  // Route 3: Control Tower Demo
  demo: {
    title: string;
    subhead: string;
    container_id: string;
    transit_segment: string;
    mesh_status: string;
    day_counter: string;
    cargo_select_label: string;
    cargo_berries: string;
    cargo_beef: string;
    cargo_dairy: string;
    cargo_fruits: string;
    slider_temp: string;
    slider_temp_desc: string;
    slider_ethanol: string;
    slider_ethanol_desc: string;
    slider_ethanol_threshold: string;
    slider_rh: string;
    slider_rh_desc: string;
    slider_vib: string;
    slider_vib_desc: string;
    presets_title: string;
    preset_optimal: string;
    preset_kuryk: string;
    preset_rail: string;
    preset_heat: string;
    bhi_title: string;
    bhi_status_optimal: string;
    bhi_status_warning: string;
    bhi_status_critical: string;
    rsl_title: string;
    rsl_days: string;
    rsl_hours: string;
    rsl_margin_ahead: string;
    rsl_margin_deficit: string;
    chart_title: string;
    chart_baseline: string;
    chart_predicted: string;
    chart_threshold: string;
    chart_x_axis: string;
    chart_y_axis: string;
    map_title: string;
    map_subtitle: string;
    map_kuryk_name: string;
    map_baku_name: string;
    map_poti_name: string;
    map_istanbul_name: string;
    map_bottleneck_badge: string;
    map_bottleneck_tooltip: string;
    ai_box_title: string;
    ai_status_optimal: string;
    ai_status_warning: string;
    ai_status_critical: string;
    ai_msg_optimal: string;
    ai_msg_warning: string;
    ai_msg_critical: string;
    ai_action_label: string;
    ai_action_optimal: string;
    ai_action_warning: string;
    ai_action_critical: string;
    ai_saved_label: string;
    ai_saved_optimal: string;
    ai_saved_warning: string;
    ai_saved_critical: string;
    ai_btn_dispatch: string;
    ai_toast_dispatched: string;
  };

  // Route 4: ROI Calculator
  roi: {
    title: string;
    subhead: string;
    inputs_title: string;
    in_fleet: string;
    in_fleet_unit: string;
    in_value: string;
    in_value_unit: string;
    in_trips: string;
    in_trips_unit: string;
    in_loss_rate: string;
    in_loss_rate_unit: string;
    in_loss_rate_note: string;
    preset_berries: string;
    preset_beef: string;
    preset_dairy: string;
    outputs_title: string;
    out_annual_loss: string;
    out_annual_loss_sub: string;
    out_saved_capital: string;
    out_saved_capital_sub: string;
    out_investment: string;
    out_investment_sub: string;
    out_net_profit: string;
    out_net_profit_sub: string;
    out_roi: string;
    out_roi_sub: string;
    out_payback: string;
    out_payback_sub: string;
    chart_title: string;
    chart_bar_status_quo: string;
    chart_bar_freshstream: string;
    chart_legend_spoilage: string;
    chart_legend_cost: string;
    chart_legend_profit: string;
    cta_banner_title: string;
    cta_banner_sub: string;
    cta_btn: string;
  };

  // Route 5: Technology
  tech: {
    title: string;
    subhead: string;
    tier_selector_title: string;
    tier1_badge: string;
    tier1_title: string;
    tier1_desc: string;
    tier1_p1: string;
    tier1_p2: string;
    tier1_p3: string;
    tier2_badge: string;
    tier2_title: string;
    tier2_desc: string;
    tier2_p1: string;
    tier2_p2: string;
    tier2_p3: string;
    tier3_badge: string;
    tier3_title: string;
    tier3_desc: string;
    tier3_p1: string;
    tier3_p2: string;
    tier3_p3: string;
    tier4_badge: string;
    tier4_title: string;
    tier4_desc: string;
    tier4_p1: string;
    tier4_p2: string;
    tier4_p3: string;
    tier5_badge: string;
    tier5_title: string;
    tier5_desc: string;
    tier5_p1: string;
    tier5_p2: string;
    tier5_p3: string;
    diagram_title: string;
  };

  // Route 6: Market & Investors
  market: {
    title: string;
    subhead: string;
    tam_title: string;
    tam_val: string;
    tam_desc: string;
    sam_title: string;
    sam_val: string;
    sam_desc: string;
    som_title: string;
    som_val: string;
    som_desc: string;
    ask_card_title: string;
    ask_card_val: string;
    ask_card_sub: string;
    alloc_title: string;
    alloc_rd_title: string;
    alloc_rd_pct: string;
    alloc_rd_desc: string;
    alloc_infra_title: string;
    alloc_infra_pct: string;
    alloc_infra_desc: string;
    alloc_sales_title: string;
    alloc_sales_pct: string;
    alloc_sales_desc: string;
    card_cac_title: string;
    card_cac_val: string;
    card_cac_desc: string;
    card_ltv_title: string;
    card_ltv_val: string;
    card_ltv_desc: string;
    card_ratio_title: string;
    card_ratio_val: string;
    card_ratio_desc: string;
    card_roi_title: string;
    card_roi_val: string;
    card_roi_desc: string;
    card_payback_title: string;
    card_payback_val: string;
    card_payback_desc: string;
    traction_title: string;
    traction_sub: string;
    traction_interviews_num: string;
    traction_interviews_lbl: string;
    traction_pilots_num: string;
    traction_pilots_lbl: string;
    traction_company_1: string;
    traction_company_2: string;
    traction_company_3: string;
    roadmap_title: string;
    roadmap_q1: string;
    roadmap_q2: string;
    roadmap_q3: string;
    cta_title: string;
    cta_desc: string;
    cta_btn: string;
  };

  // Route 7: Contact & Lead Capture
  contact: {
    title: string;
    subhead: string;
    tab_pilot: string;
    tab_investor: string;
    tab_academic: string;
    fn_name: string;
    fn_email: string;
    fn_company: string;
    fn_category: string;
    fn_fleet: string;
    fn_corridor: string;
    fn_message: string;
    placeholder_name: string;
    placeholder_email: string;
    placeholder_company: string;
    placeholder_message: string;
    opt_cat_pilot: string;
    opt_cat_investor: string;
    opt_cat_academic: string;
    opt_cat_media: string;
    opt_fleet_1: string;
    opt_fleet_2: string;
    opt_fleet_3: string;
    opt_fleet_4: string;
    opt_fleet_na: string;
    opt_corridor_middle: string;
    opt_corridor_china: string;
    opt_corridor_eu: string;
    opt_corridor_domestic: string;
    btn_submit: string;
    btn_submitting: string;
    success_title: string;
    success_desc: string;
    btn_reset: string;
    error_title: string;
    error_desc: string;
    info_hq_title: string;
    info_hq_address: string;
    info_us_title: string;
    info_us_address: string;
    info_contacts_title: string;
  };

  // Common UI Primitives
  common: {
    loading: string;
    error: string;
    not_found: string;
    back_home: string;
    learn_more: string;
    view_details: string;
    close: string;
    days: string;
    hours: string;
    status_active: string;
    status_warning: string;
    status_critical: string;
  };

  // SaaS Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    stat_active: string;
    stat_healthy: string;
    stat_warning: string;
    stat_critical: string;
    stat_value: string;
    stat_avg_bhi: string;
    alerts_title: string;
    alerts_subtitle: string;
    alerts_empty: string;
    alert_action_required: string;
    alert_dismiss: string;
    filter_all: string;
  };

  // Shipments Table
  shipments: {
    table_title: string;
    table_sub: string;
    search_placeholder: string;
    filter_status_all: string;
    filter_optimal: string;
    filter_warning: string;
    filter_critical: string;
    col_id: string;
    col_cargo: string;
    col_route: string;
    col_telemetry: string;
    col_bhi: string;
    col_eta: string;
    col_status: string;
    col_action: string;
    btn_inspect: string;
    empty_search: string;
  };

  // Shipment Detail
  shipment_detail: {
    breadcrumb_dash: string;
    breadcrumb_shipments: string;
    back_button: string;
    telemetry_title: string;
    telemetry_sub: string;
    meta_exporter: string;
    meta_carrier: string;
    meta_container: string;
    meta_cargo_value: string;
    meta_origin: string;
    meta_destination: string;
    meta_dep_date: string;
    ml_title: string;
    ml_badge: string;
    ml_desc: string;
    ml_predicted_rul: string;
    ml_confidence: string;
  };

  // Support
  support: {
    title: string;
    subtitle: string;
    badge: string;
    ticket_success_title: string;
    ticket_success_desc: string;
    emergency_title: string;
    emergency_desc: string;
  };

  // Analytics
  analytics: {
    title: string;
    subtitle: string;
    badge: string;
    metric_spoilage_rate: string;
    metric_spoilage_baseline: string;
    metric_saved_capital: string;
    metric_co2_avoided: string;
    metric_on_time_shelf: string;
    transit_integrity: string;
    port_kuryk_bottleneck: string;
    modal_breakdown: string;
  };

  // Authentication & Session
  auth: {
    sign_in_title: string;
    sign_in_subtitle: string;
    email_label: string;
    email_placeholder: string;
    password_label: string;
    password_placeholder: string;
    sign_in_button: string;
    signing_in: string;
    sign_out: string;
    demo_credentials_title: string;
    demo_admin_btn: string;
    demo_operator_btn: string;
    invalid_credentials: string;
    unauthorized_message: string;
    welcome_back: string;
    session_active: string;
    operator_role: string;
    admin_role: string;
  };
}
