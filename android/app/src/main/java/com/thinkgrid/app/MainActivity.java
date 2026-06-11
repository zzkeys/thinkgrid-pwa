package com.thinkgrid.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 注册 Capacitor App 插件以确保返回按钮事件被正确处理
        // 包括 Android 手势返回（侧滑返回）
    }
}
