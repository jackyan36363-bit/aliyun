/**
 * 卫星任务数据分析应用 - 简化版（后端统计）
 * 功能：通过WebSocket查询后端统计结果并渲染图表
 */
class SatelliteApp {
    constructor() {
        this.charts = {}; // 图表实例
        this.currentFilters = null; // 当前筛选条件
        this.isLoading = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('📊 初始化卫星任务分析应用...');

        // 初始化日期选择器
        this.initDatePickers();

        // 初始化事件监听
        this.initEventListeners();

        // 初始化WebSocket数据变更监听
        this.initWebSocketListeners();

        console.log('✅ 应用初始化完成');
    }

    /**
     * 初始化日期选择器
     */
    initDatePickers() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // 默认最近3个月

        document.getElementById('startDate').valueAsDate = startDate;
        document.getElementById('endDate').valueAsDate = endDate;
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 生成统计按钮
        document.getElementById('generateChart').addEventListener('click', () => {
            this.generateChart();
        });

        // 显示数据标签checkbox
        const showDataLabels = document.getElementById('showDataLabels');
        if (showDataLabels) {
            showDataLabels.addEventListener('change', (e) => {
                this.toggleDataLabels(e.target.checked);
            });
        }

        // 卫星数量卡片点击
        const satelliteCard = document.getElementById('satelliteCountCard');
        if (satelliteCard) {
            satelliteCard.addEventListener('click', () => {
                this.showSatelliteTrend();
            });
        }

        // 客户数量卡片点击
        const customerCard = document.getElementById('customerCountCard');
        if (customerCard) {
            customerCard.addEventListener('click', () => {
                this.showCustomerTrend();
            });
        }

        // 周期规则配置按钮
        const configBtn = document.getElementById('configGroupingBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                this.showGroupingConfig();
            });
        }

        // 关闭配置模态框
        const closeConfigBtn = document.getElementById('closeConfigModal');
        if (closeConfigBtn) {
            closeConfigBtn.addEventListener('click', () => {
                this.hideGroupingConfig();
            });
        }
    }

    /**
     * 初始化WebSocket监听
     */
    initWebSocketListeners() {
        // 数据变更时提示用户刷新
        window.wsManager.onDataChange = (data) => {
            this.showDataChangeNotification();
        };

        // 连接状态变化
        window.wsManager.onConnectionChange = (connected) => {
            this.updateConnectionStatus(connected);
        };
    }

    /**
     * 生成统计图表
     */
    async generateChart() {
        if (this.isLoading) {
            console.log('⚠️ 正在加载中，请稍候');
            return;
        }

        try {
            this.isLoading = true;
            this.showLoading(true);

            // 获取筛选条件
            const filters = this.getFilters();
            this.currentFilters = filters;

            console.log('📊 查询统计数据:', filters);

            // 查询计划统计数据
            const planStats = await window.wsManager.queryStats('plan_stats', filters);
            console.log('✅ 计划统计数据:', planStats);

            // 查询概览数据
            const overview = await window.wsManager.queryStats('overview', filters);
            console.log('✅ 概览数据:', overview);

            // 渲染图表
            this.renderMainChart(planStats.records, filters.groupBy);

            // 更新统计卡片
            this.updateStatsCards(overview.records[0], planStats.records);

            // 更新详细表格
            this.updateDetailTable(planStats.records);

            this.showLoading(false);

        } catch (error) {
            console.error('❌ 生成统计失败:', error);
            this.showError('生成统计失败: ' + error.message);
            this.showLoading(false);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 获取筛选条件
     */
    getFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const groupBy = document.getElementById('groupBy').value;

        return {
            startDate,
            endDate,
            groupBy
        };
    }

    /**
     * 渲染主图表
     */
    renderMainChart(records, groupBy) {
        const canvas = document.getElementById('dataChart');
        if (!canvas) return;

        // 销毁旧图表
        if (this.charts.main) {
            this.charts.main.destroy();
        }

        // 准备数据
        const labels = records.map(r => r.period);
        const planCounts = records.map(r => r.plan_count);
        const failureCounts = records.map(r => r.failure_count);
        const successRates = records.map(r => r.success_rate);

        // 创建图表 - 全部使用折线图
        const ctx = canvas.getContext('2d');
        this.charts.main = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '计划ID数量',
                        data: planCounts,
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: '失败圈次',
                        data: failureCounts,
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: '成功率(%)',
                        data: successRates,
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `计划ID计数与任务状态趋势图 (按${this.getGroupByLabel(groupBy)})`
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    datalabels: {
                        display: false, // 默认不显示，由checkbox控制
                        align: 'top',
                        anchor: 'end',
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        formatter: (value, context) => {
                            // 为成功率数据集添加百分号
                            if (context.dataset.label === '成功率(%)') {
                                return value.toFixed(1) + '%';
                            }
                            return value;
                        },
                        color: (context) => {
                            // 使用与线条相同的颜色
                            return context.dataset.borderColor;
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '数量'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '成功率(%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });

        console.log('✅ 主图表渲染完成');
    }

    /**
     * 更新统计卡片
     */
    updateStatsCards(overview, planStats) {
        if (!overview) return;

        // 总计划数
        document.getElementById('totalCount').textContent = overview.total_plans || 0;

        // 平均周期计划数
        const avgCount = planStats.length > 0
            ? Math.round(planStats.reduce((sum, r) => sum + r.plan_count, 0) / planStats.length)
            : 0;
        document.getElementById('avgCount').textContent = avgCount;

        // 总失败圈次
        document.getElementById('totalFailures').textContent = overview.total_failures || 0;

        // 平均成功率
        document.getElementById('avgSuccessRate').textContent = (overview.avg_success_rate || 0).toFixed(2) + '%';

        // 最大/最小周期计划数
        if (planStats.length > 0) {
            const counts = planStats.map(r => r.plan_count);
            document.getElementById('maxCount').textContent = Math.max(...counts);
            document.getElementById('minCount').textContent = Math.min(...counts);
        }

        // 卫星/客户数量
        document.getElementById('satelliteCount').textContent = overview.satellite_count || 0;
        document.getElementById('customerCount').textContent = overview.customer_count || 0;
    }

    /**
     * 更新详细表格
     */
    updateDetailTable(records) {
        const tbody = document.getElementById('detailTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.period}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.plan_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">${record.failure_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">${record.success_rate}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.range_start} ~ ${record.range_end}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * 显示卫星趋势
     */
    async showSatelliteTrend() {
        if (!this.currentFilters) {
            alert('请先生成统计结果');
            return;
        }

        try {
            console.log('📊 查询卫星趋势...');
            const result = await window.wsManager.queryStats('satellite_trend', this.currentFilters);

            // TODO: 渲染卫星趋势图表
            console.log('✅ 卫星趋势数据:', result);
            alert('卫星趋势功能开发中...');

        } catch (error) {
            console.error('❌ 查询卫星趋势失败:', error);
            this.showError('查询失败: ' + error.message);
        }
    }

    /**
     * 显示客户趋势
     */
    async showCustomerTrend() {
        if (!this.currentFilters) {
            alert('请先生成统计结果');
            return;
        }

        try {
            console.log('📊 查询客户趋势...');
            const result = await window.wsManager.queryStats('customer_trend', this.currentFilters);

            // TODO: 渲染客户趋势图表
            console.log('✅ 客户趋势数据:', result);
            alert('客户趋势功能开发中...');

        } catch (error) {
            console.error('❌ 查询客户趋势失败:', error);
            this.showError('查询失败: ' + error.message);
        }
    }

    /**
     * 显示/隐藏配置模态框
     */
    showGroupingConfig() {
        const modal = document.getElementById('groupingConfigModal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('modalContent').classList.remove('scale-95', 'opacity-0');
            }, 10);
        }
    }

    hideGroupingConfig() {
        const modal = document.getElementById('groupingConfigModal');
        if (modal) {
            document.getElementById('modalContent').classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    /**
     * 显示数据变更通知
     */
    showDataChangeNotification() {
        // 简单提示，可以改为更友好的UI
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">🔄</span>
                <span>数据已更新，建议重新查询</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    ✕
                </button>
            </div>
        `;
        document.body.appendChild(notification);

        // 5秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * 更新连接状态
     */
    updateConnectionStatus(connected) {
        const wsStatus = document.getElementById('wsStatus');
        const wsStatusText = document.getElementById('wsStatusText');

        if (!wsStatus || !wsStatusText) return;

        if (connected) {
            wsStatusText.textContent = '✅ WebSocket已连接';
            wsStatus.className = 'mb-6 p-3 bg-green-100 text-green-700 rounded-lg';

            // 3秒后隐藏
            setTimeout(() => {
                wsStatus.classList.add('hidden');
            }, 3000);
        } else {
            wsStatusText.textContent = '❌ WebSocket连接断开，正在重连...';
            wsStatus.className = 'mb-6 p-3 bg-red-100 text-red-700 rounded-lg';
            wsStatus.classList.remove('hidden');
        }
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        const loadingState = document.getElementById('chartLoadingState');
        if (loadingState) {
            if (show) {
                loadingState.classList.remove('hidden');
            } else {
                loadingState.classList.add('hidden');
            }
        }
    }

    /**
     * 显示错误
     */
    showError(message) {
        const errorState = document.getElementById('chartErrorState');
        const errorMessage = document.getElementById('chartErrorMessage');

        if (errorState && errorMessage) {
            errorMessage.textContent = message;
            errorState.classList.remove('hidden');

            // 5秒后隐藏
            setTimeout(() => {
                errorState.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * 切换数据标签显示
     */
    toggleDataLabels(show) {
        if (!this.charts.main) {
            console.warn('⚠️ 图表未创建，无法切换数据标签');
            return;
        }

        // 更新图表配置
        this.charts.main.options.plugins.datalabels.display = show;
        this.charts.main.update();

        console.log(`📊 数据标签${show ? '已显示' : '已隐藏'}`);
    }

    /**
     * 获取分组标签
     */
    getGroupByLabel(groupBy) {
        const labels = {
            'day': '日',
            'week': '周',
            'month': '月',
            'quarter': '季度'
        };
        return labels[groupBy] || groupBy;
    }
}

// 全局实例
window.satelliteApp = new SatelliteApp();
