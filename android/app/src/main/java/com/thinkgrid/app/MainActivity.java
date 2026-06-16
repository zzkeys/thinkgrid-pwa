package com.thinkgrid.app;

import android.os.Bundle;
import android.os.Build;
import androidx.annotation.RequiresApi;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Capacitor 8.x 插件通过注解自动注册，无需手动添加
        // backButton 监听在 JS 层通过 @capacitor/app 处理
        // Android 13+ 的预测性返回手势由 Capacitor 内部处理
    }
}
