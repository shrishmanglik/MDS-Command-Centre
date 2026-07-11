package ai.milliondollarstudio.companion;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.view.View;
import android.widget.*;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
  private static final int PICK_MEDIA = 42, RECORD_PERMISSION = 43;
  private EditText gateway, note;
  private TextView status;
  private byte[] media;
  private String mimeType;
  private MediaRecorder recorder;
  private File recording;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(32,48,32,32);
    TextView title = new TextView(this); title.setText("MDS Mobile Companion"); title.setTextSize(24); root.addView(title);
    TextView boundary = new TextView(this); boundary.setText("Explicit capture only. New nodes are quarantined until paired. No execution authority."); boundary.setPadding(0,12,0,20); root.addView(boundary);
    gateway = field("Gateway URL", "http://10.0.2.2:5178"); root.addView(gateway);
    note = field("Work-order note", ""); root.addView(note);
    Button screenshot = button("Choose screenshot"); screenshot.setOnClickListener(v -> chooseScreenshot()); root.addView(screenshot);
    Button record = button("Record voice note"); record.setOnClickListener(v -> toggleRecording(record)); root.addView(record);
    Button submit = button("Submit quarantined input"); submit.setOnClickListener(v -> submit()); root.addView(submit);
    status = new TextView(this); status.setPadding(0,20,0,0); status.setText("No input selected."); root.addView(status);
    setContentView(root);
  }

  private EditText field(String hint, String value) { EditText field = new EditText(this); field.setHint(hint); field.setText(value); field.setMinHeight(56); return field; }
  private Button button(String text) { Button button = new Button(this); button.setText(text); button.setMinHeight(56); return button; }
  private void chooseScreenshot() { Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE); startActivityForResult(intent, PICK_MEDIA); }
  @Override protected void onActivityResult(int request, int result, Intent data) { super.onActivityResult(request,result,data); if(request == PICK_MEDIA && result == RESULT_OK && data != null) try { Uri uri=data.getData(); mimeType=getContentResolver().getType(uri); media=readBounded(getContentResolver().openInputStream(uri),8*1024*1024); status.setText("Screenshot selected: "+media.length+" bytes"); } catch(Exception e){ status.setText("Selection blocked: "+e.getMessage()); } }
  private void toggleRecording(Button button) { if(recorder != null){ stopRecording(); button.setText("Record voice note"); return; } if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){ requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},RECORD_PERMISSION); return; } try { recording=new File(getCacheDir(),"voice-note.m4a"); recorder=new MediaRecorder(); recorder.setAudioSource(MediaRecorder.AudioSource.MIC); recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4); recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC); recorder.setOutputFile(recording); recorder.prepare(); recorder.start(); button.setText("Stop recording"); status.setText("Recording microphone. Tap stop to finish."); } catch(Exception e){ recorder=null; status.setText("Recording blocked: "+e.getMessage()); } }
  private void stopRecording(){ try { recorder.stop(); recorder.release(); recorder=null; media=readBounded(new FileInputStream(recording),12*1024*1024); mimeType="audio/mp4"; status.setText("Voice note ready: "+media.length+" bytes"); } catch(Exception e){ status.setText("Recording blocked: "+e.getMessage()); } }
  private byte[] readBounded(InputStream in,int limit)throws IOException{ try { ByteArrayOutputStream out=new ByteArrayOutputStream(); byte[] buf=new byte[8192]; int total=0,n; while((n=in.read(buf))!=-1){ total+=n; if(total>limit)throw new IOException("Input exceeds limit"); out.write(buf,0,n); } return out.toByteArray(); } finally { if(in!=null)in.close(); } }
  private void submit(){ if(media==null){ status.setText("Select a screenshot or record a voice note first."); return; } status.setText("Submitting..."); new Thread(() -> { try { JSONObject body=new JSONObject(); body.put("nodeId", Settings.Secure.getString(getContentResolver(),Settings.Secure.ANDROID_ID)); body.put("label","Android companion"); body.put("note",note.getText().toString()); body.put("mimeType",mimeType); body.put("dataBase64",Base64.encodeToString(media,Base64.NO_WRAP)); URL url=new URL(gateway.getText().toString().replaceAll("/$","")+"/api/mobile-node/intake"); HttpURLConnection connection=(HttpURLConnection)url.openConnection(); connection.setConnectTimeout(5000); connection.setReadTimeout(15000); connection.setRequestMethod("POST"); connection.setRequestProperty("Content-Type","application/json"); connection.setDoOutput(true); connection.getOutputStream().write(body.toString().getBytes(StandardCharsets.UTF_8)); int code=connection.getResponseCode(); runOnUiThread(() -> status.setText(code==201 ? "Submitted. Check Command Centre pairing gate." : "Gateway returned HTTP "+code)); } catch(Exception e){ runOnUiThread(() -> status.setText("Submission blocked: "+e.getMessage())); } }).start(); }
  @Override protected void onDestroy(){ if(recorder!=null){ recorder.release(); recorder=null; } super.onDestroy(); }
}
